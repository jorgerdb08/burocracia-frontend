import { AlertTriangle, Loader2 } from 'lucide-react'

export function AlertErr({ msg, onClose }: { msg: string; onClose?: () => void }) {
  return (
    <div className="alert alert-error animate-fade-in-up" style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
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
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function AlertSucc({ msg, onClose }: { msg: string; onClose?: () => void }) {
  return (
    <div className="alert animate-fade-in-up" style={{
      marginTop: 'var(--space-2)',
      backgroundColor: '#DCFCE7',
      borderColor: '#86EFAC',
      color: '#166534',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      borderRadius: '6px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 500 }}>
        <span>✓</span>
        <span>{msg}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontWeight: 700 }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function RunningInfo({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="panel animate-fade-in-up" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--petrol-800)',
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
