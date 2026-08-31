import { useRef, useEffect } from 'react'
import { Terminal } from 'lucide-react'

export function LogLine({ line }: { line: string }) {
  if (/INFO:/.test(line)) return <div className="text-zinc-300 font-mono py-0.5"><span className="text-zinc-400 font-bold mr-2 text-[10px]">INFO</span>{line.replace('INFO:', '')}</div>
  if (/WARNING:/.test(line)) return <div className="text-amber-300 font-mono py-0.5"><span className="text-amber-400 font-bold mr-2 text-[10px]">WARN</span>{line.replace('WARNING:', '')}</div>
  if (/ERROR:/.test(line)) return <div className="text-rose-400 font-mono py-0.5"><span className="text-rose-400 font-bold mr-2 text-[10px]">ERR</span>{line.replace('ERROR:', '')}</div>
  if (/DEBUG:/.test(line)) return <div className="text-zinc-500 font-mono py-0.5"><span className="text-zinc-600 font-bold mr-2 text-[10px]">DBG</span>{line.replace('DEBUG:', '')}</div>
  if (/líquido/i.test(line) || /\d+[.,]\d+\s*€/.test(line)) return <div className="text-emerald-400 font-bold font-mono py-0.5">{line}</div>
  return <div className="text-zinc-400 font-mono py-0.5">{line}</div>
}

export function LogViewer({ raw }: { raw: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [raw])
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-[#09090b] shadow-2xl">
      <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-zinc-400" />
          <span className="text-xs text-zinc-300 font-mono font-medium">Consola de Ejecución en Tiempo Real</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">LangGraph Audit</span>
      </div>
      <div ref={ref} className="p-5 font-mono text-xs leading-relaxed max-h-[440px] overflow-y-auto">
        {raw.split('\n').map((l, i) => <LogLine key={i} line={l} />)}
      </div>
    </div>
  )
}
