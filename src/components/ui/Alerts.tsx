
import { AlertTriangle, Loader2 } from 'lucide-react'

export function AlertErr({ msg }: { msg: string }) {
  return (
    <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-start gap-3 mt-4 animate-fade-in-up">
      <AlertTriangle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Error en la ejecución</p>
        <pre className="text-xs text-rose-500 dark:text-rose-400 font-mono mt-1 whitespace-pre-wrap">{msg}</pre>
      </div>
    </div>
  )
}

export function RunningInfo({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="p-6 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center gap-4 animate-fade-in-up">
      <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-md">
        <Loader2 size={20} className="animate-spin" />
      </div>
      <div>
        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{text}</p>
        {sub && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
