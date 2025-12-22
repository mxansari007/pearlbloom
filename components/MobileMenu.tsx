// src/components/MobileMenu.tsx
'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useUIStore } from "@/store/ui-store";

type Props = {
  open: boolean
  onClose: () => void
}


export default function MobileMenu({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null)
  const startNavigation = useUIStore((s) => s.start);

  // lock body scroll when open
  useEffect(() => {
    if (open) {
      document.documentElement.classList.add('no-scroll')
      // focus first link when open
      setTimeout(() => firstLinkRef.current?.focus(), 120)
    } else {
      document.documentElement.classList.remove('no-scroll')
    }
    return () => document.documentElement.classList.remove('no-scroll')
  }, [open])

  // close on escape, trap some keys
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        // simple focus trap: keep focus inside panel
        const panel = panelRef.current
        if (!panel) return
        const focusable = panel.querySelectorAll<HTMLElement>(
          'a, button, input, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // close when clicking backdrop
  function onBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    // backdrop: fade in/out + blur
    <div
      aria-hidden={!open}
      className={`menu-backdrop fixed inset-0 z-50 flex ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onMouseDown={onBackdropClick}
    >
      {/* animated panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
        className={`menu-panel ml-auto h-full w-full max-w-sm transform-gpu ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent backdrop-blur-sm px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 text-lg font-display">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[linear-gradient(135deg,rgba(212,175,55,0.12),transparent)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="rgb(212,175,55)"/>
                </svg>
              </div>
              <span>Aurum</span>
            </Link>

            <button
              aria-label="Close menu"
              onClick={onClose}
              className="rounded-full p-2 text-slate-200/90 hover:bg-white/3 transition"
            >
              ×
            </button>
          </div>

          <nav className="mt-8 flex-1">
            <ul className="space-y-4">
              <li>
                <Link href="/" ref={firstLinkRef as any} className="block text-lg font-medium text-slate-100 hover:text-white transition" onClick={onClose}>Home</Link>
              </li>
              <li>
                <Link href="/products" className="block text-lg font-medium text-slate-100 hover:text-white transition" onClick={onClose}>Products</Link>
              </li>
              <li>
                <Link href="/craft" className="block text-lg font-medium text-slate-100 hover:text-white transition" onClick={onClose}>Our Craft</Link>
              </li>
              <li>
                <Link href="/contact" className="block text-lg font-medium text-slate-100 hover:text-white transition" onClick={onClose}>Contact</Link>
              </li>
            </ul>
          </nav>

          {/* footer actions */}
          <div className="mt-auto pt-6">
            <a href="/products" className="btn-cta block text-center mb-4">Shop Now</a>
          </div>
        </div>
      </div>
    </div>
  )
}
