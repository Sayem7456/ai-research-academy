"use client"
import React, { useState } from 'react'

export function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[rgb(var(--color-border))] py-2">
      <button
        className="w-full text-left flex justify-between items-center"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span>{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

export default function Accordion({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md bg-[rgb(var(--color-background))]">{children}</div>
}
