"use client"
import React, { useState } from 'react'

type Tab = { id: string; label: string; content: React.ReactNode }

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0)
  return (
    <div>
      <div role="tablist" className="flex gap-2">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={`px-3 py-1 rounded-md ${active === i ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))]' : 'bg-[rgb(var(--color-muted))] text-[rgb(var(--color-foreground))]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">
        {tabs[active]?.content}
      </div>
    </div>
  )
}
