import { useState, useCallback } from 'react'
import { GitBranch, Loader2 } from 'lucide-react'
import { Btn } from '../ui/Btn'
import { AlertErr } from '../ui/Alerts'

export function ViewGrafo({ taskId }: { taskId?: string }) {
  const [running, setRunning] = useState(false)
  const [mermaid, setMermaid] = useState('')
  const [error, setError] = useState('')

  const generar = useCallback(async () => {
    setRunning(true); setError(''); setMermaid('')
    try {
      const url = taskId ? `/api/grafo/${taskId}` : '/api/grafo'
      const d = await (await fetch(url)).json()
      if (!d.ok) throw new Error(d.error)
      setMermaid(d.mermaid)
    } catch (e: any) { setError(e.message) }
    finally { setRunning(false) }
  }, [taskId])

  const src = mermaid
    ? `<!DOCTYPE html><html><head><style>html,body{margin:0;padding:20px;background:#fff;font-family:sans-serif}.mermaid svg{max-width:100%;height:auto}</style></head><body><pre class="mermaid">${mermaid}</pre><script type="module">import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';mermaid.initialize({startOnLoad:true,theme:'neutral'});</script></body></html>`
    : ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
        <div>
          <h4 className="text-xs font-bold uppercase text-zinc-800 dark:text-zinc-200">Grafo de pasos LangGraph</h4>
          <p className="text-[11px] text-zinc-500">Visualice la ruta de nodos y transiciones ejecutada por el agente.</p>
        </div>
        <Btn size="sm" onClick={generar} disabled={running}>
          {running ? <><Loader2 size={13} className="animate-spin" /> Renderizando...</> : <><GitBranch size={13} /> Generar grafo</>}
        </Btn>
      </div>

      {!running && !mermaid && !error && (
        <div className="py-12 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          Haga clic en «Generar grafo» para consultar el autómata de estados.
        </div>
      )}

      {running && (
        <div className="py-12 flex items-center justify-center gap-2 text-zinc-500 text-xs">
          <Loader2 size={16} className="animate-spin" /> Generando representación gráfica...
        </div>
      )}

      {error && <AlertErr msg={error} />}

      {mermaid && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white">
          <iframe srcDoc={src} className="w-full h-[500px] border-none" title="LangGraph" />
        </div>
      )}
    </div>
  )
}
