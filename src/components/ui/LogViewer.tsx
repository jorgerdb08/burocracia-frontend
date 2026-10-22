import { useRef, useEffect } from 'react'
import { Terminal } from 'lucide-react'

export function LogLine({ line }: { line: string }) {
  if (/INFO:/.test(line)) {
    return (
      <div className="log-line log-line-info">
        <span style={{ color: '#94A3B8', fontWeight: 'bold', marginRight: '8px', fontSize: '10px' }}>INFO</span>
        {line.replace('INFO:', '')}
      </div>
    );
  }
  if (/WARNING:/.test(line)) {
    return (
      <div className="log-line log-line-warn">
        <span style={{ color: '#F59E0B', fontWeight: 'bold', marginRight: '8px', fontSize: '10px' }}>WARN</span>
        {line.replace('WARNING:', '')}
      </div>
    );
  }
  if (/ERROR:/.test(line)) {
    return (
      <div className="log-line log-line-err">
        <span style={{ color: '#EF4444', fontWeight: 'bold', marginRight: '8px', fontSize: '10px' }}>ERR</span>
        {line.replace('ERROR:', '')}
      </div>
    );
  }
  if (/DEBUG:/.test(line)) {
    return (
      <div className="log-line log-line-dbg">
        <span style={{ color: '#64748B', fontWeight: 'bold', marginRight: '8px', fontSize: '10px' }}>DBG</span>
        {line.replace('DEBUG:', '')}
      </div>
    );
  }
  if (/líquido/i.test(line) || /\d+[.,]\d+\s*€/.test(line)) {
    return <div className="log-line log-line-highlight">{line}</div>;
  }
  return <div className="log-line">{line}</div>;
}

export function LogViewer({ raw }: { raw: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [raw])
  return (
    <div className="log-viewer">
      <div className="log-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Terminal size={14} style={{ color: '#94A3B8' }} />
          <span style={{ fontSize: 'var(--text-xs)', color: '#E2E8F0', fontFamily: 'var(--font-mono)', fontWeight: 'var(--font-medium)' }}>
            Consola de Fiscalización y Trazabilidad
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          LangGraph Audit
        </span>
      </div>
      <div ref={ref} className="log-body">
        {raw.split('\n').map((l, i) => <LogLine key={i} line={l} />)}
      </div>
    </div>
  )
}
