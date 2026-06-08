"use client"
import Link from 'next/link'
import React from 'react'

export default function TopNav() {
  return (
    <header className="w-full border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          AI Research
        </Link>
        <nav className="hidden md:flex gap-4 items-center">
          <Link href="/(math)" className="text-sm">Mathematics</Link>
          <Link href="/(ml)" className="text-sm">ML</Link>
          <Link href="/(cv)" className="text-sm">CV</Link>
          <Link href="/(llm)" className="text-sm">LLM</Link>
          <Link href="/(research)" className="text-sm">Research</Link>
          <Link href="/(practice)" className="text-sm">Practice</Link>
        </nav>
        <div className="flex items-center gap-2">
          <button aria-label="Toggle theme" className="p-2 rounded-md">Theme</button>
          <button aria-label="Open mobile menu" className="md:hidden p-2">Menu</button>
        </div>
      </div>
    </header>
  )
}
