import React from 'react'

export default function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-[rgb(var(--color-muted))] px-2 py-0.5 text-sm text-[rgb(var(--color-foreground))] ${className}`}>
      {children}
    </span>
  )
}
