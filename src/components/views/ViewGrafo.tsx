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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="panel" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            Grafo de pasos LangGraph
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Visualización de la ruta de nodos y transiciones ejecutadas por el agente de fiscalización.
          </p>
        </div>
        <Btn size="sm" onClick={generar} disabled={running}>
          {running ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Renderizando...</> : <><GitBranch size={13} /> Generar grafo</>}
        </Btn>
      </div>

      {!running && !mermaid && !error && (
        <div className="panel" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', borderStyle: 'dashed' }}>
          Haga clic en «Generar grafo» para consultar el autómata de estados de liquidación.
        </div>
      )}

      {running && (
        <div style={{ padding: 'var(--space-8)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Generando representación visual del grafo de fiscalización...</span>
        </div>
      )}

      {error && <AlertErr msg={error} />}

      {mermaid && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <iframe srcDoc={src} style={{ width: '100%', height: '500px', border: 'none' }} title="LangGraph" />
        </div>
      )}
    </div>
  )
}
