import { useState, useEffect } from 'react'
import { Sun, Moon, ChevronDown } from 'lucide-react'
import { cn } from './lib/utils'
import { ChatWidget } from './ChatWidget'
import { ViewHeroLayout } from './components/views/ViewHeroLayout'
import { ViewProcesar } from './components/views/ViewProcesar'
import { ViewExpedientes } from './components/views/ViewExpedientes'
import { ViewLotesBatch } from './components/views/ViewLotesBatch'
import { GeneradorHonorariosInteligente } from './components/views/GeneradorHonorariosInteligente'
import { ExpedienteInspectorModal } from './components/modals/ExpedienteInspectorModal'

type View = 'inicio' | 'procesar' | 'expedientes' | 'lotes' | 'honorarios'

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
    return (v && ['inicio', 'procesar', 'expedientes', 'lotes', 'honorarios'].includes(v)) ? v : 'inicio';
  })
  const [casoParam, setCaso]         = useState<string | undefined>()
  const [templateParam, setTemplate] = useState<string | undefined>()
  const [inspectCasoId, setInspectCasoId] = useState<string | null>(null)

  const irProcesar = (casoId?: string, templateId?: string) => {
    setCaso(casoId)
    setTemplate(templateId)
    setView('procesar')
  }

  return (
    <div className="uex-shell">
      
      {/* Header Institucional: UEx SGTRI / Intervención Económica */}
      <header className="uex-header">
        <div className="uex-header-inner">
          <div className="uex-header-left">
            <button 
              onClick={() => setView('inicio')}
              className="uex-header-brand"
            >
              <img src="/uex_emblem.svg" alt="UEx" style={{ height: '30px', width: 'auto', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.15, color: 'var(--color-navy)', textAlign: 'left' }}>
                <span>UNIVERSIDAD</span>
                <span>DE EXTREMADURA</span>
              </div>
              <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)', margin: '0 8px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, textAlign: 'left' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-navy)', letterSpacing: '-0.01em' }}>SGTRI</span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 400 }}>Gestión Económica</span>
              </div>
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

              <button 
                onClick={() => irProcesar()}
                className={cn('uex-nav-link', view === 'procesar' && 'active')}
              >
                Tramitar expediente
              </button>

              <button 
                onClick={() => setView('lotes')}
                className={cn('uex-nav-link', view === 'lotes' && 'active')}
              >
                Lotes masivos
              </button>
            </nav>
          </div>

          <div className="uex-header-right">
            <button 
              type="button"
              className="uex-fiscal-year" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                padding: '4px 10px', 
                fontSize: '11.5px', 
                cursor: 'pointer' 
              }}
            >
              <span>Bases 2026</span>
              <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
            </button>

            <button 
              onClick={() => setIsDark(!isDark)} 
              className="uex-theme-btn"
              title="Alternar tema claro / oscuro"
              type="button"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div 
              style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--bg-blue-soft)', 
                color: 'var(--color-blue-inst)', 
                border: '1px solid #D0DFEF',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '11px', 
                fontWeight: 600,
                letterSpacing: '0.02em',
                flexShrink: 0
              }}
              title="Usuario: Jorge"
            >
              JR
            </div>
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
          <GeneradorHonorariosInteligente />
        )}
      </main>

      {inspectCasoId && (
        <ExpedienteInspectorModal 
          casoId={inspectCasoId} 
          onClose={() => setInspectCasoId(null)}
          onTramitar={(id) => irProcesar(id)}
        />
      )}

      <ChatWidget currentView={view} />
    </div>
  )
}
