import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Scale, Send, Plus, History, X, Trash2, Sparkles, Bot, Zap, CheckCircle2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  updatedAt: number;
}

const PREGUNTAS_SUGERIDAS = [
  { etiqueta: "Dietas 42/2025", prompt: "¿Cuánto es la dieta por manutención según el Decreto 42/2025?" },
  { etiqueta: "Km (0,26 €)", prompt: "¿A cuánto se abona el kilómetro en vehículo particular y qué debo aportar?" },
  { etiqueta: "Límite IRPF hotel", prompt: "¿Cuál es el límite exento de IRPF para hotel y qué pasa si cuesta más?" },
  { etiqueta: "Tarjeta UEx", prompt: "¿Cómo se justifican los gastos pagados con tarjeta institucional frente a particular?" },
  { etiqueta: "Justificantes obligatorios", prompt: "¿Qué documentos son obligatorios para liquidar una comisión de servicio?" }
];

export function ChatWidget({ 
  currentView, 
  externalOpen, 
  onToggleOpen 
}: { 
  currentView: string;
  externalOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const setIsOpen = (val: boolean) => {
    setInternalOpen(val);
    if (onToggleOpen) onToggleOpen(val);
  };

  const [selectedModel, setSelectedModel] = useState<'gemini' | 'gpt-oss'>('gemini');

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('burocracia_chat_sessions') || localStorage.getItem('gcia_chat_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [{
      id: 'default',
      title: 'Consulta Normativa UEx',
      messages: [{ 
        role: 'assistant', 
        content: '👋 **Bienvenido/a al Asistente Normativo y Fiscal de BurocracIA (UEx - SGTRI).**\n\nEstoy conectado con **Google Gemini 2.5 Flash** y capacitado en la normativa oficial de la Universidad de Extremadura:\n- **Baremos de dietas y manutención** (Decreto 42/2025: 102,56 €/día; 51,28 € comida/cena).\n- **Kilometraje en vehículo particular** (0,26 €/km y peajes/parking).\n- **Límites de hotel y exención de IRPF** (102,56 € UEx y 65,97 € límite fiscal Grupo 2).\n- **Pagos a proveedores y honorarios** (Modelo M-03 con 15 % IRPF).\n- **Instrucciones para tramitar** expedientes con BurocracIA y el agente liquidador.\n\n¿En qué podemos orientarle hoy?' 
      }],
      model: 'gemini',
      updatedAt: Date.now()
    }];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>('default');
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem('burocracia_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const enviarMensajeTexto = async (texto: string) => {
    const msgText = texto.trim();
    if (!msgText || loading) return;

    const userMsg: Message = { role: 'user', content: msgText };
    const updatedMessages = [...messages, userMsg];
    
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: updatedMessages,
          title: s.messages.length <= 1 ? msgText.slice(0, 32) + '...' : s.title,
          updatedAt: Date.now()
        };
      }
      return s;
    }));

    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
          current_view: currentView
        })
      });
      const data = await res.json();
      
      let botResponse = 'Lo sentimos, hubo un problema al procesar la respuesta con el servicio institucional.';
      if (data.ok && data.response) {
        botResponse = data.response;
      } else if (data.error) {
        botResponse = `Error: ${data.error}`;
      }

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, { role: 'assistant', content: botResponse }],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } catch {
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, { role: 'assistant', content: 'No se pudo contactar con el servicio de IA de la UEx. Verifique que el servidor backend esté en ejecución.' }],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    enviarMensajeTexto(input);
  };

  const handleNewChat = (model = selectedModel) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Nueva Consulta',
      messages: [{ 
        role: 'assistant', 
        content: `¡Hola! Soy el asistente virtual de la UEx operando con **${model === 'gemini' ? 'Google Gemini 2.5 Flash' : 'Groq LPU'}**. Pregúntame cualquier duda sobre normativas de dietas, kilometraje, límites de IRPF o justificación de tus gastos.` 
      }],
      model: model,
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setShowHistory(false);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleNewChat();
      setSessions(prev => prev.filter(s => s.id !== id));
      return;
    }
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered[0].id);
    }
  };

  return (
    <div className="chat-root" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999 }}>
      
      {/* Botón flotante prominente (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #176B52 0%, #0F4C3A 100%)',
            color: '#FFFFFF',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
          }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer font-semibold text-xs tracking-wide group"
          title="Abrir Asistente Virtual Inteligente UEx (Consultas Normativas)"
          type="button"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles size={18} style={{ color: '#FBBF24' }} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white" />
          </div>
          <span className="font-bold tracking-tight">Asistente BurocracIA</span>
          <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 font-semibold">
            Gemini 2.5 Flash
          </span>
        </button>
      )}

      {/* Ventana de chat desplegada */}
      {isOpen && (
        <div 
          className="chat-window bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
          style={{
            width: '450px',
            maxWidth: 'calc(100vw - 32px)',
            height: '610px',
            maxHeight: 'calc(100vh - 70px)'
          }}
        >
          {/* Header Institucional Pulido */}
          <div 
            style={{ background: 'linear-gradient(135deg, #176B52 0%, #115340 100%)' }}
            className="p-3.5 text-white flex items-center justify-between shadow-xs select-none border-b border-emerald-800/40"
          >
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: 'none' }}
                className="p-1.5 rounded-lg hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="Historial de consultas"
                type="button"
              >
                <History size={15} />
              </button>
              
              <div className="flex items-center gap-2">
                <div 
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
                  className="p-1.5 rounded-lg text-white flex items-center justify-center"
                >
                  <Scale size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs leading-tight flex items-center gap-1.5">
                    <span>Asistente BurocracIA</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" title="Servicio activo" />
                  </div>
                  <div className="text-[10.5px] text-emerald-100/90 flex items-center gap-1 mt-0.5">
                    <span>SGTRI</span>
                    <span>·</span>
                    <span>Decreto 42/2025</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Badge indicativo del modelo en uso */}
              <div 
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-100 font-semibold"
                title="Modelo de lenguaje activo para inferencia y fiscalización"
              >
                <Zap size={11} className="text-amber-300" />
                <span>{selectedModel === 'gemini' ? 'Gemini 2.5 Flash' : 'Groq LPU'}</span>
              </div>

              <button 
                onClick={() => handleNewChat()} 
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: 'none' }}
                className="p-1.5 rounded-lg hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="Nueva Consulta"
                type="button"
              >
                <Plus size={15} />
              </button>
              
              <button 
                onClick={() => setIsOpen(false)} 
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: 'none' }}
                className="p-1.5 rounded-lg hover:bg-white/25 text-white transition-colors cursor-pointer"
                title="Minimizar chat"
                type="button"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Selector de Modelo y Estado */}
          <div className="px-3.5 py-1.5 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300">
            <div className="flex items-center gap-1.5 font-medium">
              <Bot size={13} className="text-[#176B52]" />
              <span>Modelo activo:</span>
              <span className="font-bold text-[#176B52] dark:text-emerald-400">
                {selectedModel === 'gemini' ? 'Google Gemini 2.5 Flash' : 'Groq LPU (Llama-3.3 70B)'}
              </span>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => {
                const m = e.target.value as 'gemini' | 'gpt-oss';
                setSelectedModel(m);
                handleNewChat(m);
              }}
              className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 cursor-pointer focus:outline-none"
              title="Cambiar motor de inferencia"
            >
              <option value="gemini">Gemini 2.5 Flash (Predeterminado)</option>
              <option value="gpt-oss">Groq LPU (Respaldo ultrarrápido)</option>
            </select>
          </div>

          {/* Historial o Conversación */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2 bg-zinc-50 dark:bg-zinc-950/40">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Historial de Consultas</span>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-[#176B52] hover:underline cursor-pointer font-semibold"
                >
                  Volver al chat
                </button>
              </div>
              {sessions.map(s => (
                <div 
                  key={s.id}
                  onClick={() => { setCurrentSessionId(s.id); setShowHistory(false); }}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    s.id === currentSessionId 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-semibold text-[#176B52] dark:text-emerald-300' 
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="truncate">{s.title || 'Consulta'}</span>
                    <span className="block text-[10px] text-zinc-400 font-normal">{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteChat(s.id, e)}
                    className="text-zinc-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                    title="Eliminar sesión"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Sugerencias Rápidas / Atajos */}
              <div className="px-3 py-2 bg-zinc-50/80 dark:bg-zinc-950/60 border-b border-zinc-200/70 dark:border-zinc-800/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-0.5">
                  Atajos:
                </span>
                {PREGUNTAS_SUGERIDAS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => enviarMensajeTexto(item.prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-[#176B52] text-zinc-700 dark:text-zinc-300 hover:text-[#176B52] dark:hover:text-emerald-400 transition-all cursor-pointer shrink-0 shadow-2xs font-medium hover:bg-emerald-50/50"
                  >
                    {item.etiqueta}
                  </button>
                ))}
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-zinc-900 text-xs">
                {messages.map((m, i) => (
                  <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-[#176B52] dark:text-emerald-300 flex items-center justify-center mr-2 shrink-0 mt-0.5 shadow-2xs">
                        <Scale size={14} />
                      </div>
                    )}
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                        m.role === 'user' 
                          ? 'bg-[#176B52] text-white rounded-br-xs shadow-xs font-normal' 
                          : 'bg-zinc-50 dark:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200 rounded-bl-xs border border-zinc-200/80 dark:border-zinc-700/70 shadow-xs'
                      }`}
                    >
                      {m.role === 'assistant' && (
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-200/60 dark:border-zinc-700/60 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                          <span>Asistente Oficial UEx</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">Gemini 2.5 Flash</span>
                        </div>
                      )}
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                          li: ({ node, ...props }) => <li className="leading-snug" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-bold text-inherit" {...props} />,
                          table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table className="w-full text-[11px] border-collapse border border-zinc-300 dark:border-zinc-700" {...props} /></div>,
                          th: ({ node, ...props }) => <th className="border border-zinc-300 dark:border-zinc-700 px-2 py-1 bg-zinc-200/60 dark:bg-zinc-700/60 font-bold text-left" {...props} />,
                          td: ({ node, ...props }) => <td className="border border-zinc-300 dark:border-zinc-700 px-2 py-1" {...props} />,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-[#176B52] dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <Scale size={14} />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 animate-pulse">
                      <Sparkles size={14} className="text-[#176B52] animate-spin" />
                      <span>Google Gemini 2.5 Flash analizando normativa UEx...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/50">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                  className="flex items-center gap-2"
                >
                  <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Pregunte sobre dietas, km, IRPF o el agente..." 
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#176B52] shadow-2xs"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    style={{ backgroundColor: '#176B52', color: '#ffffff', border: 'none' }}
                    className="p-2.5 rounded-xl text-white disabled:opacity-40 hover:bg-[#125842] transition-colors cursor-pointer shadow-xs shrink-0 flex items-center justify-center"
                    title="Enviar consulta"
                  >
                    <Send size={14} />
                  </button>
                </form>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center mt-1.5 flex items-center justify-center gap-1">
                  <CheckCircle2 size={10} className="text-emerald-600" />
                  <span>Motor activo: <strong>Google Gemini 2.5 Flash</strong> · Decreto 42/2025</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
