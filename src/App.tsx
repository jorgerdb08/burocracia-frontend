import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from './lib/utils'
import { ChatWidget } from './ChatWidget'
import { ViewHeroLayout } from './components/views/ViewHeroLayout'
import { ViewProcesar } from './components/views/ViewProcesar'
import { ViewExpedientes } from './components/views/ViewExpedientes'
import { ViewLotesBatch } from './components/views/ViewLotesBatch'
import { ExpedienteInspectorModal } from './components/modals/ExpedienteInspectorModal'

type View = 'inicio' | 'procesar' | 'expedientes' | 'lotes'

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

  const [view, setView]              = useState<View>('inicio')
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
              <img src="/logo_v2.jpg" alt="UEx" className="uex-logo-img" />
              <div className="uex-brand-info">
                <span className="uex-brand-title">Universidad de Extremadura</span>
                <span className="uex-brand-sub">SGTRI · Gestión Económica</span>
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
            <span className="uex-fiscal-year">Bases 2026</span>

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
