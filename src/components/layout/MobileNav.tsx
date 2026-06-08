"use client"
import React, { useState } from 'react'
import Link from 'next/link'

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const items = [
    { href: '/', label: 'Home' },
    { href: '/(math)', label: 'Mathematics' },
    { href: '/(ml)', label: 'Machine Learning' },
    { href: '/(cv)', label: 'Computer Vision' },
    { href: '/(llm)', label: 'LLM' },
    { href: '/(research)', label: 'Research' },
    { href: '/(practice)', label: 'Practice' },
    { href: '/(dashboard)', label: 'Dashboard' }
  ]

  return (
    <div className="md:hidden">
      <div className="px-4 py-2 flex items-center justify-between">
        <Link href="/" className="font-semibold">AI Research</Link>
        <button onClick={() => setOpen((s) => !s)} aria-expanded={open} className="p-2 rounded-md">{open ? 'Close' : 'Menu'}</button>
      </div>
      {open && (
        <div className="px-4 pb-4">
          <nav className="flex flex-col gap-2">
            {items.map((it) => (
              <Link key={it.href} href={it.href} className="px-3 py-2 rounded-md hover:bg-[rgb(var(--color-muted))]">{it.label}</Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
