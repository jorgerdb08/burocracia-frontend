import { useState, useCallback } from 'react'
import { GitBranch, Loader2, Code2 } from 'lucide-react'
import { Btn } from '../ui/Btn'
import { AlertErr } from '../ui/Alerts'

interface GrafoNodo {
  id: string
  label: string
}

interface GrafoArista {
  source: string
  target: string
  conditional?: boolean
  label?: string
}

const NODE_TITLES: Record<string, { title: string; subtitle: string }> = {
  __start__: { title: 'Inicio', subtitle: 'START' },
  extraer_texto: { title: 'Extracción Documental', subtitle: 'extraer_texto' },
  llamar_llm: { title: 'Extracción Semántica LLM', subtitle: 'llamar_llm' },
  validar_respuesta: { title: 'Validación de Esquema', subtitle: 'validar_respuesta' },
  calcular: { title: 'Cálculo Normativo', subtitle: 'calcular' },
  evaluar: { title: 'Auditoría y Dictamen', subtitle: 'evaluar' },
  __end__: { title: 'Fin', subtitle: 'END' },
}

export function ViewGrafo({ taskId }: { taskId?: string }) {
  const [running, setRunning] = useState(false)
  const [mermaid, setMermaid] = useState('')
  const [nodos, setNodos] = useState<GrafoNodo[]>([])
  const [aristas, setAristas] = useState<GrafoArista[]>([])
  const [showMermaidCode, setShowMermaidCode] = useState(false)
  const [error, setError] = useState('')

  const generar = useCallback(async () => {
    setRunning(true)
    setError('')
    setMermaid('')
    try {
      const url = taskId ? `/api/grafo/${encodeURIComponent(taskId)}` : '/api/grafo'
      const res = await fetch(url)
      const text = await res.text()
      let d: any
      try {
        d = JSON.parse(text)
      } catch {
        throw new Error(`El servidor respondió con un formato inesperado (HTTP ${res.status}).`)
      }
      if (!res.ok || !d.ok) throw new Error(d?.error || `Error HTTP ${res.status}`)
      setMermaid(d.mermaid || '')
      setNodos(Array.isArray(d.nodos) ? d.nodos : [])
      setAristas(Array.isArray(d.aristas) ? d.aristas : [])
    } catch (e: any) {
      setError(e?.message || 'No se pudo consultar el grafo de ejecución.')
    } finally {
      setRunning(false)
    }
  }, [taskId])

  // Orden topológico determinista para posicionar los nodos del pipeline en SVG
  const preferredOrder = ['__start__', 'extraer_texto', 'llamar_llm', 'validar_respuesta', 'calcular', 'evaluar', '__end__']
  const orderedNodes = [...nodos].sort((a, b) => {
    const ia = preferredOrder.indexOf(a.id)
    const ib = preferredOrder.indexOf(b.id)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })

  const nodeW = 190
  const nodeH = 52
  const gapY = 34
  const startY = 26
  const svgW = 540
  const centerX = 210
  const svgH = Math.max(240, startY * 2 + orderedNodes.length * (nodeH + gapY) - gapY)

  const posMap: Record<string, { x: number; y: number }> = {}
  orderedNodes.forEach((n, idx) => {
    posMap[n.id] = { x: centerX, y: startY + idx * (nodeH + gapY) }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="panel" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            Grafo de pasos LangGraph
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Visualización de la ruta de nodos y transiciones ejecutadas por el agente de fiscalización.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {mermaid && (
            <Btn size="sm" variant="outline" onClick={() => setShowMermaidCode(v => !v)}>
              <Code2 size={13} /> {showMermaidCode ? 'Ocultar Mermaid' : 'Ver código Mermaid'}
            </Btn>
          )}
          <Btn size="sm" onClick={generar} disabled={running}>
            {running ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Renderizando...</> : <><GitBranch size={13} /> Generar grafo</>}
          </Btn>
        </div>
      </div>

      {!running && orderedNodes.length === 0 && !error && (
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

      {orderedNodes.length > 0 && (
        <div className="panel" style={{ padding: '16px', backgroundColor: 'var(--bg-surface)', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Arquitectura del Agente ({orderedNodes.length} nodos · {aristas.length} transiciones)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: '#14213D' }} /> Transición directa
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ display: 'inline-block', width: '16px', borderTop: '2px dashed #176B52' }} /> Transición condicional
              </span>
            </div>
          </div>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', maxWidth: '580px', height: 'auto', display: 'block', margin: '0 auto' }}>
            <defs>
              <marker id="arrow-solid" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#14213D" />
              </marker>
              <marker id="arrow-cond" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#176B52" />
              </marker>
            </defs>

            {aristas.map((e, idx) => {
              const p1 = posMap[e.source]
              const p2 = posMap[e.target]
              if (!p1 || !p2) return null

              const i1 = orderedNodes.findIndex(n => n.id === e.source)
              const i2 = orderedNodes.findIndex(n => n.id === e.target)
              const isBackEdge = i2 < i1
              const isConditional = Boolean(e.conditional)

              if (isBackEdge) {
                const rightX = centerX + nodeW / 2
                const y1 = p1.y + nodeH / 2
                const y2 = p2.y + nodeH / 2
                const loopX = rightX + 95
                return (
                  <g key={idx}>
                    <path
                      d={`M ${rightX} ${y1} C ${loopX} ${y1}, ${loopX} ${y2}, ${rightX + 4} ${y2}`}
                      fill="none"
                      stroke="#D97706"
                      strokeWidth="2"
                      strokeDasharray="5,4"
                      markerEnd="url(#arrow-cond)"
                    />
                    <rect x={loopX - 46} y={(y1 + y2) / 2 - 11} width="92" height="22" rx="4" fill="#FFFBEB" stroke="#FCD34D" />
                    <text x={loopX} y={(y1 + y2) / 2 + 3} textAnchor="middle" fontSize="10" fontWeight="700" fill="#B45309">
                      Reintento JSON
                    </text>
                  </g>
                )
              }

              const x1 = centerX
              const y1 = p1.y + nodeH
              const x2 = centerX
              const y2 = p2.y - 4

              return (
                <g key={idx}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isConditional ? '#176B52' : '#14213D'}
                    strokeWidth="2"
                    strokeDasharray={isConditional ? '5,4' : undefined}
                    markerEnd={isConditional ? 'url(#arrow-cond)' : 'url(#arrow-solid)'}
                  />
                  {isConditional && e.target !== 'llamar_llm' && (
                    <text x={x1 + 12} y={(y1 + y2) / 2 + 3} fontSize="10" fontWeight="600" fill="#176B52">
                      Válido
                    </text>
                  )}
                </g>
              )
            })}

            {orderedNodes.map(n => {
              const p = posMap[n.id]
              const meta = NODE_TITLES[n.id] || { title: n.label, subtitle: n.id }
              const isTerminal = n.id === '__start__' || n.id === '__end__'
              return (
                <g key={n.id} transform={`translate(${p.x - nodeW / 2}, ${p.y})`}>
                  <rect
                    width={nodeW}
                    height={nodeH}
                    rx={isTerminal ? 26 : 8}
                    fill={isTerminal ? '#14213D' : '#F8FAFC'}
                    stroke={isTerminal ? '#14213D' : '#CBD5E1'}
                    strokeWidth="1.5"
                  />
                  <text
                    x={nodeW / 2}
                    y={22}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill={isTerminal ? '#FFFFFF' : '#14213D'}
                  >
                    {meta.title}
                  </text>
                  <text
                    x={nodeW / 2}
                    y={39}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="monospace"
                    fill={isTerminal ? '#CBD5E1' : '#526783'}
                  >
                    {meta.subtitle}
                  </text>
                </g>
              )
            })}
          </svg>

          {showMermaidCode && mermaid && (
            <pre
              style={{
                marginTop: '14px',
                padding: '14px 16px',
                borderRadius: '6px',
                backgroundColor: '#0F172A',
                color: '#E2E8F0',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                overflowX: 'auto',
                border: '1px solid #1E293B',
                lineHeight: 1.5,
              }}
            >
              {mermaid}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
