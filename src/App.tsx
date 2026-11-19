import { useState, useEffect, useRef } from 'react'
import { Sun, Moon, ChevronDown, Plane, GraduationCap, CreditCard, FolderArchive } from 'lucide-react'
import { cn } from './lib/utils'
import { ChatWidget } from './ChatWidget'
import { ViewHeroLayout } from './components/views/ViewHeroLayout'
import { ViewProcesar } from './components/views/ViewProcesar'
import { ViewExpedientes } from './components/views/ViewExpedientes'
import { ViewLotesBatch } from './components/views/ViewLotesBatch'
import { GeneradorHonorariosInteligente } from './components/views/GeneradorHonorariosInteligente'
import { GeneradorProveedoresInteligente } from './components/views/GeneradorProveedoresInteligente'
import { ExpedienteInspectorModal } from './components/modals/ExpedienteInspectorModal'

type View = 'inicio' | 'procesar' | 'expedientes' | 'lotes' | 'honorarios' | 'proveedores'

export default function App() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
      document.documentElement.style.colorScheme = 'light'
    }
  }, [isDark])

  const [view, setView] = useState<View>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view') as View;
    return (v && ['inicio', 'procesar', 'expedientes', 'lotes', 'honorarios', 'proveedores'].includes(v)) ? v : 'inicio';
  })
  const [casoParam, setCaso]         = useState<string | undefined>(() => {
    return new URLSearchParams(window.location.search).get('caso') || undefined;
  })
  const [templateParam, setTemplate] = useState<string | undefined>(() => {
    return new URLSearchParams(window.location.search).get('template') || undefined;
  })
  const [inspectCasoId, setInspectCasoId] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isTramitarOpen, setIsTramitarOpen] = useState(false)
  const tramitarRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<any>(null)

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsTramitarOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsTramitarOpen(false);
    }, 220);
  };

  // Cerrar el desplegable de trámites al hacer clic fuera o pulsar Escape
  useEffect(() => {
    if (!isTramitarOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (tramitarRef.current && !tramitarRef.current.contains(e.target as Node)) {
        setIsTramitarOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsTramitarOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isTramitarOpen]);

  const irProcesar = (casoId?: string, tipoOrTemplate?: string) => {
    setCaso(casoId);
    setTemplate(tipoOrTemplate);
    const tNorm = (tipoOrTemplate || '').toLowerCase();
    const cNorm = (casoId || '').toLowerCase();
    if (tNorm === 'honorarios' || tNorm === 'honorario' || cNorm.includes('premio') || cNorm.includes('conferencia') || cNorm.includes('contrato') || cNorm.includes('convenio') || cNorm.includes('honorarios')) {
      setView('honorarios');
    } else if (tNorm === 'proveedores' || tNorm === 'pago_proveedor' || tNorm === 'proveedor' || cNorm.includes('tarjeta') || cNorm.includes('transferencia') || cNorm.startsWith('exp_prov')) {
      setView('proveedores');
    } else {
      setView('procesar');
    }
  };

  return (
    <div className="uex-shell">
      
      {/* Header Institucional: UEx SGTRI / Intervención Económica */}
      <header className="uex-header">
        <div className="uex-header-inner">
          <div className="uex-header-left">
            <button 
              onClick={() => setView('inicio')}
              className="uex-header-brand"
              title="Ir a Inicio"
            >
              <img 
                src="/logo-uex.png" 
                alt="Universidad de Extremadura" 
                className="uex-brand-logo"
              />
            </button>
            
            <nav className="uex-nav">
              <button 
                onClick={() => setView('inicio')}
                className={cn('uex-nav-link', view === 'inicio' && 'active')}
              >
                Inicio
              </button>

              <button 
                onClick={() => setView('expedientes')}
                className={cn('uex-nav-link', view === 'expedientes' && 'active')}
              >
                Expedientes
              </button>

              {/* Desplegable institucional: Nuevo trámite (Hover y Horizontal) */}
              <div 
                ref={tramitarRef} 
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ position: 'relative' }}
              >
                <button 
                  type="button"
                  onClick={() => setIsTramitarOpen(prev => !prev)}
                  className={cn(
                    'uex-nav-link',
                    ['procesar', 'lotes', 'honorarios', 'proveedores'].includes(view) && 'active'
                  )}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                  aria-expanded={isTramitarOpen}
                >
                  <span>Nuevo trámite</span>
                  <ChevronDown 
                    size={14} 
                    style={{ 
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)', 
                      transform: isTramitarOpen ? 'rotate(180deg)' : 'none' 
                    }} 
                  />
                </button>

                {isTramitarOpen && (
                  <div 
                    className="uex-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      width: '740px',
                      maxWidth: 'calc(100vw - 32px)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                      padding: '12px',
                      zIndex: 100,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '10px'
                    }}
                  >
                    {/* Tarjeta 1: Dietas y desplazamientos */}
                    <button
                      type="button"
                      onClick={() => { irProcesar(undefined, 'dietas'); setIsTramitarOpen(false); }}
                      className={cn('uex-dropdown-card', view === 'procesar' && 'active-card')}
                    >
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        backgroundColor: 'rgba(23, 107, 82, 0.12)',
                        color: '#176B52',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10
                      }}>
                        <Plane size={18} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, lineHeight: 1.2 }}>
                        Dietas y viajes
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                        Comisiones de servicio, kilometraje y alojamiento
                      </span>
                    </button>

                    {/* Tarjeta 2: Honorarios a terceros */}
                    <button
                      type="button"
                      onClick={() => { setView('honorarios'); setIsTramitarOpen(false); }}
                      className={cn('uex-dropdown-card', view === 'honorarios' && 'active-card')}
                    >
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        backgroundColor: 'rgba(20, 33, 61, 0.1)',
                        color: 'var(--color-navy)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10
                      }}>
                        <GraduationCap size={18} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, lineHeight: 1.2 }}>
                        Honorarios
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                        Conferencias, colaboraciones y retenciones IRPF
                      </span>
                    </button>

                    {/* Tarjeta 3: Pago a proveedores */}
                    <button
                      type="button"
                      onClick={() => { setView('proveedores'); setIsTramitarOpen(false); }}
                      className={cn('uex-dropdown-card', view === 'proveedores' && 'active-card')}
                    >
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        backgroundColor: 'rgba(23, 79, 145, 0.1)',
                        color: 'var(--color-blue-inst)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10
                      }}>
                        <CreditCard size={18} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, lineHeight: 1.2 }}>
                        Proveedores
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                        Facturas de compras con tarjeta o transferencia
                      </span>
                    </button>

                    {/* Tarjeta 4: Tramitación por lotes */}
                    <button
                      type="button"
                      onClick={() => { setView('lotes'); setIsTramitarOpen(false); }}
                      className={cn('uex-dropdown-card', view === 'lotes' && 'active-card')}
                    >
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        backgroundColor: 'rgba(57, 150, 109, 0.12)',
                        color: '#39966D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10
                      }}>
                        <FolderArchive size={18} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, lineHeight: 1.2 }}>
                        Lotes masivos
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                        Procesamiento simultáneo en carpetas de I+D
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>

          <div className="uex-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setIsDark(!isDark)} 
              className="uex-theme-btn"
              title="Alternar tema claro / oscuro"
              type="button"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      <main className="uex-main">
        {view === 'inicio' && (
          <ViewHeroLayout 
            onComenzar={() => irProcesar()} 
            onComenzarConPlantilla={(tId) => irProcesar(undefined, tId)}
            onIrLotes={() => setView('lotes')}
            onIrExpedientes={() => setView('expedientes')}
            onIrHonorarios={() => setView('honorarios')}
            onIrProveedores={() => setView('proveedores')}
            onTramitarCaso={(casoId) => irProcesar(casoId)}
            onInspeccionarCaso={(id) => setInspectCasoId(id)}
          />
        )}
        {view === 'procesar' && (
          <ViewProcesar 
            key={(templateParam || 'none') + (casoParam || 'none')} 
            initialCaso={casoParam} 
            templateId={templateParam} 
            onVolver={() => setView('inicio')}
            onIrHonorarios={() => setView('honorarios')}
            onInspeccionarCaso={(id) => setInspectCasoId(id)}
          />
        )}
        {view === 'expedientes' && (
          <ViewExpedientes 
            onProcesar={irProcesar} 
            onInspeccionar={(id) => setInspectCasoId(id)}
          />
        )}
        {view === 'lotes' && (
          <ViewLotesBatch />
        )}
        {view === 'honorarios' && (
          <GeneradorHonorariosInteligente initialCasoId={casoParam} />
        )}
        {view === 'proveedores' && (
          <GeneradorProveedoresInteligente initialCasoId={casoParam} />
        )}
      </main>

      {inspectCasoId && (
        <ExpedienteInspectorModal 
          casoId={inspectCasoId} 
          onClose={() => setInspectCasoId(null)}
          onTramitar={(id) => irProcesar(id)}
        />
      )}

      <ChatWidget 
        currentView={view} 
        externalOpen={isChatOpen} 
        onToggleOpen={setIsChatOpen} 
      />
    </div>
  )
}
