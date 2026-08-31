import { useState, useEffect, useCallback, useMemo } from 'react'
import { FolderOpen, Play, Loader2, RefreshCw, ChevronRight, Eye } from 'lucide-react'
import { AlertErr } from '../ui/Alerts'
import { DarkBadge } from '../ui/Badges'
import { cn } from '../../lib/utils'
import type { DetalleCaso } from '../../lib/types'
import { StatusBadge } from '../ui/Badges'
import { Btn } from '../ui/Btn'
export function ViewExpedientes({
  onProcesar,
  onInspeccionar
}: {
  onProcesar: (id: string) => void;
  onInspeccionar: (id: string) => void;
}) {
  const [casos, setCasos] = useState<{ id: string, tipo: string, total_archivos?: number, porcentaje?: number, completo?: boolean }[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [search, setSearch] = useState('')

  const cargar = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/casos')
      const data = await res.json()
      setCasos(data.casos || [])
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const filteredCasos = useMemo(() => {
    return casos.filter(c => c.id.toLowerCase().includes(search.toLowerCase()) || c.tipo.toLowerCase().includes(search.toLowerCase()))
  }, [casos, search])

  return (
    <div className="space-y-6 animate-fade-in max-w-[96vw] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            GalerÃ­a de Expedientes
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Consulte la documentaciÃ³n de cada expediente, verifique requisitos que falten o inicie su tramitaciÃ³n.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar expediente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 w-56"
          />
          <Btn variant="outline" size="sm" onClick={cargar} disabled={status === 'loading'}>
            {status === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Actualizar
          </Btn>
        </div>
      </div>

      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-400">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-xs">Cargando catÃ¡logo de expedientes y verificando checklist...</span>
        </div>
      )}

      {status === 'error' && (
        <AlertErr msg="Fallo de conexiÃ³n con el motor Flask (http://localhost:5000)." />
      )}

      {status === 'done' && (
        <div className="flex flex-wrap justify-center gap-5">
          {filteredCasos.map((c, i) => (
            <div
              key={c.id}
              onClick={() => onInspeccionar(c.id)}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 p-6 shadow-sm hover:shadow-xl flex flex-col justify-between transition-all duration-300 cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-zinc-400 font-mono">#{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex items-center gap-1.5">
                    <DarkBadge label={c.tipo} />
                  </div>
                </div>

                <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 font-mono tracking-tight break-all">
                  {c.id}
                </h3>

                {/* Indicador de completitud y archivos */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">
                      {c.total_archivos || 0} archivo(s) digitalizado(s)
                    </span>
                    <span className={cn(
                      "font-bold",
                      c.completo ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    )}>
                      {c.porcentaje || 0}% completo
                    </span>
                  </div>

                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        c.completo ? "bg-emerald-500" : "bg-amber-500"
                      )}
                      style={{ width: `${c.porcentaje || 0}%` }}
                    />
                  </div>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onInspeccionar(c.id) }}
                  className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Eye size={13} />
                  <span>Ver docs</span>
                </button>

                <Btn
                  size="sm"
                  onClick={(e?: React.MouseEvent) => {
                    if (e) e.stopPropagation();
                    onProcesar(c.id)
                  }}
                >
                  <Play size={11} fill="currentColor" /> Tramitar
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

