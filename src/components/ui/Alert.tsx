import React from 'react'

type AlertProps = {
  variant?: 'info' | 'success' | 'danger' | 'warning'
  title?: string
  children: React.ReactNode
}

export default function Alert({ variant = 'info', title, children }: AlertProps) {
  const colors: Record<string, string> = {
    info: 'bg-[rgb(var(--color-muted))] border-[rgb(var(--color-border))] text-[rgb(var(--color-foreground))]',
    success: 'bg-[rgb(var(--color-success))] text-white',
    danger: 'bg-[rgb(var(--color-danger))] text-white',
    warning: 'bg-[rgb(var(--color-warning))] text-black'
  }
  return (
    <div className={`rounded-md p-3 ${colors[variant]}`} role="status">
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div>{children}</div>
    </div>
  )
}
