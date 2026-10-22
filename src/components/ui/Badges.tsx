import React from 'react';

export function StatusBadge({ ok, sinGt }: { ok: boolean; sinGt?: boolean }) {
  if (sinGt) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-faint)', flexShrink: 0 }} />
        <span>Auditoría pendiente</span>
      </span>
    );
  }
  return ok ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-success-text)', fontWeight: 500 }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)', flexShrink: 0 }} />
      <span>Fiscalizado conforme</span>
    </span>
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-danger-text)', fontWeight: 500 }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', flexShrink: 0 }} />
      <span>Reparos en fiscalización</span>
    </span>
  );
}

export function DarkBadge({ label }: { label: string }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
      {label}
    </span>
  );
}
