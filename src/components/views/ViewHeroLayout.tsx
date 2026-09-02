
import logo from '../../logo_v2.jpg'
import { ArrowRight } from 'lucide-react'
import { Btn } from '../ui/Btn'

export function ViewHeroLayout({ onComenzar }: { onComenzar: () => void }) {
  return (
    <div className="relative min-h-[72vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="w-[450px] h-[450px] rounded-full bg-zinc-200/50 dark:bg-zinc-800/20 blur-3xl" />
      </div>

      <div className="max-w-xl mx-auto flex flex-col items-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-md p-3.5 flex items-center justify-center">
          <img src={logo} alt="UEx" className="w-full h-full object-contain" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-[1.1]">
            Asistente Automático de
            <br />
            <span className="text-emerald-600 dark:text-emerald-500">Liquidación de Gastos</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Plataforma SGTRI impulsada por IA para la tramitación, revisión y cuadre automático de expedientes de gasto e investigación.
          </p>
        </div>

        <Btn size="hero" onClick={onComenzar} className="mt-8 rounded-full">
          Comenzar Tramitación <ArrowRight size={18} />
        </Btn>
      </div>
    </div>
  )
}
