/**
 * UNIVERSIDAD DE EXTREMADURA (UEx) - SGTRI
 * Widget de Asistencia Virtual Inteligente (BurocracIA Chat)
 *
 * Proporciona un panel interactivo flotante para resolver dudas normativas
 * sobre dietas, kilometraje, convenios y contratos de investigación:
 * - Soporte multisesión con persistencia en localStorage.
 * - Selección de motor de inferencia: Google Gemini 2.5 Flash o Groq LPU (GPT-OSS 120B).
 * - Renderizado en streaming con Markdown y tablas conformes a GitHub Flavored Markdown (remark-gfm).
 * - Detección automática del contexto de pantalla actual del usuario.
 */

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Send, Plus, History, X, Trash2, CheckCircle2, AlertCircle, ArrowLeft, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  error?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: 'gemini' | 'groq';
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
    if (onToggleOpen) onToggleOpen(val);
    else setInternalOpen(val);
  };

  const [selectedModel, setSelectedModel] = useState<'gemini' | 'groq'>('gemini');
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('burocracia_chat_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [{
      id: 'default',
      title: 'Consulta Normativa UEx',
      messages: [{ 
        role: 'assistant', 
        content: `👋 ¡Bienvenido/a al **Asistente Normativo y Fiscal de BurocracIA** (UEx – SGTRI).

Estoy capacitado en la normativa oficial de la Universidad de Extremadura:
- **Baremos de dietas y manutención** (Decreto 42/2025: 102,56 €/día; 51,28 € comida/cena).
- **Kilometraje en vehículo particular** (0,26 €/km y peajes/parking).
- **Límites de hotel y exención de IRPF** (102,56 € UEx y 65,97 € límite fiscal Grupo 2).
- **Pagos a proveedores y honorarios** (Modelo M-03 con 15 % IRPF).
- **Instrucciones para tramitar** expedientes con BurocracIA y el agente liquidador.

Puede alternar entre **Google Gemini 2.5 Flash** y **Groq LPU (GPT-OSS 120B)** desde el selector superior.

¿En qué podemos orientarle hoy?`,
        provider: 'Google Gemini',
        model: 'gemini-2.5-flash'
      }],
      model: 'gemini',
      updatedAt: Date.now()
    }];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>('default');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  // Sincronizar sesiones en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('burocracia_chat_sessions', JSON.stringify(sessions));
    } catch (e) { }
  }, [sessions]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && !showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen, showHistory]);

  // Autofocus en el input al abrir el chat
  useEffect(() => {
    if (isOpen && !showHistory) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, showHistory]);

  // Cierre automático al hacer clic fuera del chat
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (chatWindowRef.current && !chatWindowRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const enviarMensajeTexto = async (texto: string) => {
    if (!texto.trim() || loading) return;

    const userText = texto.trim();
    setInput('');

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userText }
    ];

    let newTitle = currentSession.title;
    if (currentSession.messages.length <= 1) {
      newTitle = userText.slice(0, 30) + (userText.length > 30 ? '...' : '');
    }

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          title: newTitle,
          messages: newMessages,
          updatedAt: Date.now()
        };
      }
      return s;
    }));

    setLoading(true);
    const updatedMessages = newMessages;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          model: selectedModel,
          current_view: currentView
        })
      });
      const data = await res.json();
      
      let botResponse = 'Lo sentimos, hubo un problema al procesar la respuesta con el servicio institucional.';
      let isError = false;
      let respProvider = selectedModel === 'groq' ? 'Groq LPU' : 'Google Gemini';
      let respModel = selectedModel === 'groq' ? 'openai/gpt-oss-120b' : 'gemini-2.5-flash';

      if (data.ok && data.response) {
        botResponse = data.response;
        if (data.provider) respProvider = data.provider;
        if (data.model) respModel = data.model;
      } else if (data.error) {
        botResponse = data.error;
        isError = true;
      }

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, { 
              role: 'assistant', 
              content: botResponse,
              provider: respProvider,
              model: respModel,
              error: isError
            }],
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
            messages: [...updatedMessages, { 
              role: 'assistant', 
              content: 'No se pudo contactar con el servidor backend de BurocracIA. Compruebe que el servicio Flask esté en ejecución en http://localhost:5000.',
              error: true
            }],
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
    const providerLabel = model === 'groq' ? 'Groq LPU (GPT-OSS 120B)' : 'Google Gemini 2.5 Flash';
    const newSession: ChatSession = {
      id: newId,
      title: 'Nueva Consulta',
      messages: [{ 
        role: 'assistant', 
        content: `¡Hola! Soy el asistente virtual de la UEx operando con **${providerLabel}**.\n\nPuedo resolver dudas sobre el Decreto 42/2025, justificación de dietas, kilometraje, límites de IRPF o el funcionamiento del agente liquidador.`,
        provider: model === 'groq' ? 'Groq LPU' : 'Google Gemini',
        model: model === 'groq' ? 'openai/gpt-oss-120b' : 'gemini-2.5-flash'
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
    <div className="chat-root">
      
      {/* Botón flotante circular institucional (FAB) */}
      {!isOpen && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
          className="chat-fab-btn"
          title="Abrir Asistente BurocracIA"
          aria-label="Abrir Asistente BurocracIA"
          type="button"
        >
          <Bot size={26} />
        </button>
      )}

      {/* Ventana de chat desplegada */}
      {isOpen && (
        <div 
          ref={chatWindowRef}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="chat-window"
        >
          {/* Cabecera institucional moderna */}
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF'
              }}>
                <Bot size={18} />
              </div>
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#FFFFFF' }}>
                  <span>Asistente BurocracIA</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.85)', marginTop: 2 }}>
                  SGTRI · Sede Electrónica UEx
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                type="button"
                className="chat-header-btn"
                title={showHistory ? "Volver a la conversación" : "Historial de consultas"}
              >
                <History size={15} />
              </button>

              <button 
                onClick={() => handleNewChat()} 
                type="button"
                className="chat-header-btn"
                title="Nueva consulta"
              >
                <Plus size={15} />
              </button>
              
              <button 
                onClick={() => setIsOpen(false)} 
                type="button"
                className="chat-header-btn"
                title="Cerrar asistente"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Subcabecera: Selector de modelo con alto contraste */}
          <div className="chat-subbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>MOTOR:</span>
              <select
                value={selectedModel}
                onChange={(e) => {
                  const m = e.target.value as 'gemini' | 'groq';
                  setSelectedModel(m);
                  handleNewChat(m);
                }}
                className="chat-model-select"
                title="Seleccionar motor de inteligencia artificial"
              >
                <option value="gemini">Google Gemini 2.5 Flash</option>
                <option value="groq">Groq LPU (GPT-OSS 120B)</option>
              </select>
            </div>
          </div>

          {/* Historial o Conversación */}
          {showHistory ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={16} style={{ color: '#176B52' }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Historial de Consultas</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="chat-back-btn"
                >
                  <ArrowLeft size={14} />
                  <span>Volver al chat</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sessions.map(s => {
                  const isCurrent = s.id === currentSessionId;
                  return (
                    <div 
                      key={s.id}
                      onClick={() => { setCurrentSessionId(s.id); setShowHistory(false); }}
                      className={'chat-history-card' + (isCurrent ? ' current' : '')}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0, paddingRight: 8 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          backgroundColor: isCurrent ? '#176B52' : 'var(--bg-secondary)',
                          color: isCurrent ? '#FFFFFF' : 'var(--text-secondary)'
                        }}>
                          <MessageSquare size={14} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 12.5,
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? '#176B52' : 'var(--text-primary)'
                          }}>
                            {s.title || 'Consulta'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 11, color: 'var(--text-muted)' }}>
                            <span>{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span style={{ fontWeight: 600, color: '#176B52' }}>
                              {s.model === 'groq' ? 'Groq LPU' : 'Gemini'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteChat(s.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-faint)',
                          padding: 6,
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
                        title="Eliminar sesión"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Iniciar nueva consulta */}
              <div style={{ paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={() => handleNewChat()}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px dashed var(--border-hover)',
                    backgroundColor: 'var(--bg-surface)',
                    color: '#176B52',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#176B52';
                    e.currentTarget.style.backgroundColor = '#ECFDF5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                  }}
                >
                  <Plus size={14} />
                  <span>Iniciar nueva consulta</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Sugerencias Rápidas / Atajos */}
              <div className="chat-shortcuts-bar">
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                  ATAJOS:
                </span>
                {PREGUNTAS_SUGERIDAS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => enviarMensajeTexto(item.prompt)}
                    className="chat-shortcut-chip"
                  >
                    {item.etiqueta}
                  </button>
                ))}
              </div>

              {/* Mensajes */}
              <div className="chat-body">
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', width: '100%', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 10 }}>
                    {m.role === 'assistant' && (
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: '#176B52',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2
                      }}>
                        <Bot size={15} />
                      </div>
                    )}
                    <div className={m.role === 'user' ? 'chat-bubble-user' : (m.error ? 'chat-bubble-error' : 'chat-bubble-assistant')}>
                      {m.role === 'assistant' && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingBottom: 6,
                          marginBottom: 8,
                          borderBottom: '1px solid var(--border-color)',
                          fontSize: 10.5
                        }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {m.error ? 'Incidencia del servicio' : 'Asistente BurocracIA'}
                          </span>
                          <span style={{
                            fontFamily: 'monospace',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            backgroundColor: m.error ? '#FEE2E2' : '#ECFDF5',
                            color: m.error ? '#B91C1C' : '#047857',
                            border: `1px solid ${m.error ? '#FCA5A5' : '#A7F3D0'}`
                          }}>
                            {m.model ? `${m.provider ? m.provider + ' · ' : ''}${m.model}` : (selectedModel === 'groq' ? 'Groq · GPT-OSS 120B' : 'Google Gemini · 2.5 Flash')}
                          </span>
                        </div>
                      )}

                      {m.error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#DC2626', fontWeight: 600, fontSize: 11 }}>
                          <AlertCircle size={14} style={{ flexShrink: 0 }} />
                          <span>Error en la consulta:</span>
                        </div>
                      )}

                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => <p style={{ marginBottom: 8 }} {...props} />,
                          ul: ({ node, ...props }) => <ul style={{ paddingLeft: 18, marginBottom: 8, listStyleType: 'disc' }} {...props} />,
                          ol: ({ node, ...props }) => <ol style={{ paddingLeft: 18, marginBottom: 8, listStyleType: 'decimal' }} {...props} />,
                          li: ({ node, ...props }) => <li style={{ marginBottom: 4 }} {...props} />,
                          strong: ({ node, ...props }) => <strong style={{ fontWeight: 700, color: 'inherit' }} {...props} />,
                          table: ({ node, ...props }) => <div style={{ overflowX: 'auto', margin: '8px 0' }}><table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', border: '1px solid var(--border-color)' }} {...props} /></div>,
                          th: ({ node, ...props }) => <th style={{ border: '1px solid var(--border-color)', padding: '4px 8px', backgroundColor: 'var(--bg-secondary)', fontWeight: 700, textAlign: 'left' }} {...props} />,
                          td: ({ node, ...props }) => <td style={{ border: '1px solid var(--border-color)', padding: '4px 8px' }} {...props} />,
                          code: ({ node, ...props }) => <code style={{ padding: '2px 5px', borderRadius: 4, backgroundColor: 'var(--bg-secondary)', fontFamily: 'monospace', fontSize: 11 }} {...props} />,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#176B52',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      <Bot size={15} />
                    </div>
                    <div className="chat-bubble-assistant" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#176B52', animation: 'pulse 1.5s infinite' }} />
                      <span>
                        {selectedModel === 'groq' 
                          ? 'Groq LPU (GPT-OSS 120B) analizando normativa UEx...' 
                          : 'Google Gemini 2.5 Flash analizando normativa UEx...'}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Campo de escritura y pie */}
              <div className="chat-footer">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Consulte sobre dietas, km, IRPF, facturas o el agente..." 
                    className="chat-input"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className={'chat-send-btn ' + (input.trim() && !loading ? 'active' : 'disabled')}
                    title={input.trim() ? "Enviar consulta" : "Escriba su consulta para enviar"}
                  >
                    <Send size={16} />
                  </button>
                </form>
                <div style={{
                  fontSize: 10.5,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  userSelect: 'none'
                }}>
                  <CheckCircle2 size={12} style={{ color: '#176B52', flexShrink: 0 }} />
                  <span>
                    Motor activo: <strong style={{ color: 'var(--text-primary)' }}>{selectedModel === 'groq' ? 'Groq LPU (GPT-OSS 120B)' : 'Google Gemini 2.5 Flash'}</strong> · Decreto 42/2025
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
