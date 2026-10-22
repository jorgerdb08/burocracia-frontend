import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HelpCircle, Scale, BookOpen, Send, Plus, History, X, Trash2 } from 'lucide-react';

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
      title: 'Consulta Normativa',
      messages: [{ role: 'assistant', content: 'Estimado/a usuario/a: este canal institucional resuelve dudas sobre la normativa aplicable (R.D. 462/2002, importes de dietas, contratos menores y justificación con tarjeta SGTRI). ¿En qué trámite podemos orientarle?' }],
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
    <div className="chat-root">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-toggle-btn"
          title="Consultas Normativas UEx"
          type="button"
        >
          <HelpCircle size={20} />
          <span className="chat-toggle-badge" />
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="btn btn-outline btn-sm"
                style={{ padding: '4px 6px', fontSize: '11px' }}
                title="Ver Historial"
                type="button"
              >
                <History size={14} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="chat-icon-box">
                  <Scale size={13} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    Consultas Normativas SGTRI
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Bases Presupuestarias UEx 2026
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button 
                onClick={() => handleNewChat()} 
                className="btn btn-outline btn-sm"
                style={{ padding: '4px 6px' }}
                title="Nueva Consulta"
                type="button"
              >
                <Plus size={14} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="btn btn-outline btn-sm"
                style={{ padding: '4px 6px' }}
                title="Cerrar"
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          {showHistory ? (
            <div className="chat-history-list">
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px' }}>
                Historial de Consultas
              </div>
              {sessions.sort((a,b) => b.updatedAt - a.updatedAt).map(s => {
                const isActive = currentSessionId === s.id;
                return (
                  <div 
                    key={s.id} 
                    onClick={() => { setCurrentSessionId(s.id); setSelectedModel(s.model as any); setShowHistory(false); }}
                    className={`chat-history-item ${isActive ? 'active' : ''}`}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </span>
                      <span style={{ fontSize: '10px', opacity: isActive ? 0.8 : 0.6, marginTop: '2px' }}>
                        {s.model === 'gemini' ? 'Gemini' : 'GPT-OSS'} • {new Date(s.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteChat(s.id, e)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
                      title="Eliminar consulta"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="chat-body">
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', width: '100%', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {m.role === 'assistant' && (
                      <div className="chat-icon-box" style={{ width: '24px', height: '24px', marginRight: '8px', marginTop: '2px', flexShrink: 0 }}>
                        <Scale size={13} />
                      </div>
                    )}
                    <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="chat-icon-box" style={{ width: '24px', height: '24px', marginRight: '8px', flexShrink: 0 }}>
                      <Scale size={13} />
                    </div>
                    <div className="chat-bubble-assistant" style={{ color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px' }}>Consultando normativa institucional...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="chat-footer">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Pregunte sobre dietas, facturas o justificación..." 
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className="btn btn-primary"
                    style={{ padding: '7px 12px' }}
                    title="Enviar consulta"
                  >
                    <Send size={14} />
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
