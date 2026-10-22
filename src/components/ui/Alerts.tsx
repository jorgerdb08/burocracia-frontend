import { AlertTriangle, Loader2 } from 'lucide-react'

export function AlertErr({ msg }: { msg: string }) {
  return (
    <div className="alert alert-error animate-fade-in-up" style={{ marginTop: 'var(--space-4)' }}>
      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <strong style={{ display: 'block', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-1)' }}>
          Incidencia en la ejecución
        </strong>
        <pre style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
          {msg}
        </pre>
      </div>
    </div>
  )
}

export function RunningInfo({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="panel animate-fade-in-up" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--uex-burgundy)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: 'var(--shadow-2xs)'
      }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <div>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
          {text}
        </p>
        {sub && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
