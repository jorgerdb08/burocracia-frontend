import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Sparkles, Send, Plus, History, X, Trash2 } from 'lucide-react';

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

export function ChatWidget({ currentView }: { currentView: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('gcia_chat_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [{
      id: 'default',
      title: 'Nueva Conversación',
      messages: [{ role: 'assistant', content: '¡Hola! Soy tu asistente inteligente para la liquidación de comisiones de servicio de la UEx. ¿En qué puedo orientarte hoy?' }],
      model: 'gemini',
      updatedAt: Date.now()
    }];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>('default');
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'gpt-oss'>('gemini');
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem('gcia_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMsg];
    
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: updatedMessages,
          title: s.messages.length <= 1 ? input.slice(0, 30) + '...' : s.title,
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
      
      let botResponse = 'Lo siento, hubo un problema al procesar la respuesta.';
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
    } catch (err: any) {
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, { role: 'assistant', content: 'Error de red o servidor no disponible.' }],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = (model = selectedModel) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Nueva Conversación',
      messages: [{ role: 'assistant', content: '¡Hola! ¿En qué puedo orientarte sobre la normativa o tu liquidación?' }],
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

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value as 'gemini' | 'gpt-oss';
    setSelectedModel(newModel);
    handleNewChat(newModel);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 p-4 rounded-2xl shadow-2xl hover:shadow-zinc-900/20 dark:hover:shadow-white/10 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center group relative border border-zinc-800 dark:border-zinc-200"
          title="Abrir Asistente IA"
        >
          <Bot className="w-6 h-6 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-zinc-900"></span>
          </span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-[420px] h-[580px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl flex flex-col border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-zinc-950 dark:bg-zinc-950 p-4 flex justify-between items-center text-white border-b border-zinc-800/80">
            <div className="flex gap-3 items-center">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="hover:bg-zinc-800/80 p-2 rounded-xl transition-all active:scale-95 text-zinc-400 hover:text-white"
                title="Ver Historial"
              >
                <History className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700/60 shadow-inner">
                  <Bot className="w-4 h-4 text-zinc-100" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm tracking-tight text-white leading-none">Asistente IA</h3>
                    <Sparkles size={11} className="text-zinc-400" />
                  </div>
                  <select 
                    value={selectedModel} 
                    onChange={handleModelChange}
                    className="text-[10px] bg-zinc-900 border border-zinc-700/80 text-zinc-300 rounded-lg px-2 py-0.5 outline-none focus:ring-1 focus:ring-zinc-400 mt-1 cursor-pointer w-[145px]"
                  >
                    <option value="gemini">Gemini 2.5 Flash</option>
                    <option value="gpt-oss">GPT-OSS 20B (Groq)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleNewChat()} 
                className="hover:bg-zinc-800 p-2 rounded-xl transition-all active:scale-95 text-zinc-400 hover:text-white" 
                title="Nuevo Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-zinc-800 p-2 rounded-xl transition-all active:scale-95 text-zinc-400 hover:text-white" 
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 p-3 space-y-1">
              <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-2">
                Historial de Conversaciones
              </div>
              {sessions.sort((a,b) => b.updatedAt - a.updatedAt).map(s => (
                <div 
                  key={s.id} 
                  onClick={() => { setCurrentSessionId(s.id); setSelectedModel(s.model as any); setShowHistory(false); }}
                  className={`flex justify-between items-center p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                    currentSessionId === s.id 
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md' 
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-xs font-semibold truncate">{s.title}</span>
                    <span className={`text-[10px] flex gap-1.5 items-center mt-0.5 ${currentSessionId === s.id ? 'opacity-80' : 'text-zinc-400'}`}>
                      {s.model === 'gemini' ? 'Gemini' : 'GPT-OSS'} • {new Date(s.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteChat(s.id, e)} 
                    className={`p-1.5 rounded-lg transition-colors ${currentSessionId === s.id ? 'hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-400 hover:text-red-400' : 'hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto bg-zinc-50/40 dark:bg-zinc-950/40 flex flex-col gap-3.5 relative">
                {messages.map((m, i) => (
                  <div key={i} className={`flex animate-pop ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center mr-2.5 mt-0.5 shrink-0 shadow-sm border border-zinc-300/40 dark:border-zinc-700/40">
                        <Bot size={13} />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm transition-all ${
                      m.role === 'user' 
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-br-sm' 
                        : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800/80 rounded-bl-sm shadow-zinc-100 dark:shadow-none'
                    }`}>
                      <div className="prose prose-xs dark:prose-invert max-w-none text-current prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 font-normal">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start items-center">
                    <div className="w-6 h-6 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center mr-2.5 shrink-0 shadow-sm">
                      <Bot size={13} />
                    </div>
                    <div className="bg-white dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 text-xs shadow-sm flex gap-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Pregunta sobre gastos, IRPF o el trámite..." 
                    className="flex-1 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-4 py-2.5 rounded-2xl text-xs outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all border border-transparent placeholder-zinc-400 dark:placeholder-zinc-600"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className="bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white disabled:opacity-30 text-white dark:text-zinc-900 rounded-2xl p-2.5 w-9 h-9 flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
