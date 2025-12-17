// src/components/Header.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import MobileMenu from './MobileMenu'

export default function Header() {
  const [open, setOpen] = useState(false)

  // close on route change (optional) — works if you have client-side routing hooks; keep simple
  useEffect(() => {
    function onRoute() {
      setOpen(false)
    }
    // listen for popstate to catch back/forward (not full router integration)
    window.addEventListener('popstate', onRoute)
    return () => window.removeEventListener('popstate', onRoute)
  }, [])

  return (
    <>
      <header className="border-b border-white/6 backdrop-blur-sm fixed inset-x-0 top-0 z-40 bg-[rgba(6,6,6,0.36)]">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[rgba(212,175,55,0.12)] to-transparent flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="rgb(212,175,55)"/>
              </svg>
            </div>
            <span className="text-lg font-display tracking-tight">Pearl Bloom</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/" className="text-slate-200/90 hover:text-white transition">Home</Link>
            <Link href="/products" className="text-slate-200/90 hover:text-white transition">Products</Link>
            <Link href="/craft" className="text-slate-200/70 hover:text-white transition">Our Craft</Link>
            <Link href="/contact" className="text-slate-200/70 hover:text-white transition">Contact</Link>
            <Link href="/search" className="ml-2">
              <button className="rounded-full border border-white/6 px-3 py-2 text-sm text-slate-200/80 hover:bg-white/2 transition">Search</button>
            </Link>
          </nav>

          {/* mobile actions */}
          <div className="md:hidden flex items-center gap-3">
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="rounded-full p-2 border border-white/6 text-slate-200/90 hover:bg-white/3 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="block">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* spacer so page content isn't hidden behind fixed header */}
      <div className="h-16 md:h-18" />

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  )
}
