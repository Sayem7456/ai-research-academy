import React from 'react'

export default function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] p-4 shadow-sm ${className}`}>
      {children}
    </div>
  )
}
