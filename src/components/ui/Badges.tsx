
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react'

export function StatusBadge({ ok, sinGt }: { ok: boolean; sinGt?: boolean }) {
  if (sinGt) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
        <HelpCircle size={13} className="text-zinc-500" />
        Auditoría Requerida
      </span>
    )
  }
  return ok ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
      <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
      Liquidación Cuadrada (100%)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
      <XCircle size={13} className="text-rose-600 dark:text-rose-400" />
      Desviación Detectada
    </span>
  )
}

export function DarkBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 uppercase tracking-wider">
      {label}
    </span>
  )
}
