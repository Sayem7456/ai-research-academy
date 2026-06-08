import React from 'react'

export default function Footer() {
  return (
    <footer className="w-full border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-[rgb(var(--color-muted))]">© {new Date().getFullYear()} AI Research Academy</div>
    </footer>
  )
}
