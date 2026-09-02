import React, { useState } from 'react'
import { cn } from '../../lib/utils'

export function Tabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0)
  return (
    <div className="w-full">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 overflow-x-auto">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              'px-4 py-3 text-xs font-bold border-b-2 -mb-px transition-all whitespace-nowrap cursor-pointer',
              active === i
                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-6 animate-fade-in">{tabs[active].content}</div>
    </div>
  )
}
