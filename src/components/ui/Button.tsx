"use client"
import React from 'react'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2'
  const sizes: Record<string, string> = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const variants: Record<string, string> = {
    primary:
      'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] hover:opacity-95',
    secondary: 'bg-[rgb(var(--color-muted))] text-[rgb(var(--color-foreground))] hover:opacity-95',
    ghost: 'bg-transparent border border-[rgb(var(--color-border))] text-[rgb(var(--color-foreground))]'
  }

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  )
}
