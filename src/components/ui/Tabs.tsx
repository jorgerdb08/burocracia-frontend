import React, { useState } from 'react'
import { cn } from '../../lib/utils'

export function Tabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0)
  return (
    <div style={{ width: '100%' }}>
      <div className="tabs-bar">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn('tab-btn', active === i && 'active')}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ paddingTop: 'var(--space-4)' }} className="animate-fade-in">
        {tabs[active].content}
      </div>
    </div>
  )
}
