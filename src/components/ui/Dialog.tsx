"use client"
import React, { useEffect } from 'react'

type DialogProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export default function Dialog({ open, onClose, children, title }: DialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-[rgb(var(--color-background))] p-6 shadow-lg">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <div>{children}</div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-[rgb(var(--color-muted))]">Close</button>
        </div>
      </div>
    </div>
  )
}
