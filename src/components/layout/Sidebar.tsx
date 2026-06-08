"use client"
import Link from 'next/link'
import React from 'react'

export default function Sidebar() {
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
    <aside className="hidden md:block w-64 border-r border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]">
      <div className="p-4">
        <nav className="flex flex-col gap-2">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="px-3 py-2 rounded-md hover:bg-[rgb(var(--color-muted))]">
              {it.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
