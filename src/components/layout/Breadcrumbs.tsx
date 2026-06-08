"use client"
import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Breadcrumbs() {
  const pathname = usePathname() || '/'
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = parts.map((p, i) => ({ href: '/' + parts.slice(0, i + 1).join('/'), label: decodeURIComponent(p) }))

  return (
    <nav className="text-sm text-[rgb(var(--color-muted))]" aria-label="Breadcrumbs">
      <ol className="flex gap-2 items-center">
        <li><Link href="/">Home</Link></li>
        {crumbs.map((c, idx) => (
          <li key={c.href} className="flex items-center gap-2">
            <span className="text-[rgb(var(--color-border))]">/</span>
            <Link href={c.href} className="capitalize">{c.label}</Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}
