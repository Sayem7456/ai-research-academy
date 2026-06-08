"use client"
import React from 'react'

export default function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span className="relative group inline-block">
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden transform rounded-sm bg-[rgb(var(--color-foreground))] px-2 py-1 text-xs text-[rgb(var(--color-background))] group-hover:block">
        {label}
      </span>
    </span>
  )
}
