import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from './lib/utils'
import { ChatWidget } from './ChatWidget'
import { ViewHeroLayout } from './components/views/ViewHeroLayout'
import { ViewProcesar } from './components/views/ViewProcesar'
import { ViewExpedientes } from './components/views/ViewExpedientes'
import { ExpedienteInspectorModal } from './components/modals/ExpedienteInspectorModal'

type View = 'inicio' | 'procesar' | 'expedientes'

export default function App() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    }
  }, [isDark])

  const [view, setView]              = useState<View>('inicio')
  const [casoParam, setCaso]         = useState<string | undefined>()
  const [templateParam, setTemplate] = useState<string | undefined>()
  const [inspectCasoId, setInspectCasoId] = useState<string | null>(null)

  const irProcesar = (casoId?: string) => {
    setCaso(casoId)
    setTemplate(undefined)
    setView('procesar')
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* Header Minimalista: Solo Inicio y Expedientes */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-[96vw] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setView('inicio')}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-sm">
                <span className="text-white dark:text-zinc-900 font-bold text-xs">UEx</span>
              </div>
              <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">Sede UEx</span>
            </button>
            
            <nav className="flex items-center gap-1.5 ml-2">
              <button 
                onClick={() => setView('inicio')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-2xl transition-all cursor-pointer select-none',
                  view === 'inicio' 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' 
                    : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <span>Inicio</span>
              </button>

              <button 
                onClick={() => setView('expedientes')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-2xl transition-all cursor-pointer select-none',
                  view === 'expedientes' 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' 
                    : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <span>Expedientes</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDark(!isDark)} 
              className="p-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Cambiar tema"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[96vw] mx-auto w-full px-6 py-8">
        {view === 'inicio' && (
          <ViewHeroLayout onComenzar={() => setView('procesar')} />
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
