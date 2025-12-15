// src/components/SunriseOverlay.tsx
'use client'
import { useEffect, useRef } from 'react'

export default function SunriseOverlay() {
  const lastY = useRef(typeof window !== 'undefined' ? window.scrollY : 0)
  const ticking = useRef(false)
  const overlayRef = useRef<HTMLElement | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    // Respect prefers-reduced-motion
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const el = document.createElement('div')
    el.className = 'sunrise-overlay'
    el.setAttribute('aria-hidden', 'true')
    document.body.appendChild(el)
    overlayRef.current = el
    // small debug log
    console.log('[SunriseOverlay] mounted overlay element')

    let timeoutId: number | null = null

    function triggerGlow() {
      if (!overlayRef.current) return
      overlayRef.current.classList.remove('active')
      // reflow to restart css animation
      void overlayRef.current.offsetWidth
      overlayRef.current.classList.add('active')
      // remove after 1400ms so ambient returns
      if (timeoutId) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        overlayRef.current?.classList.remove('active')
        timeoutId = null
      }, 1400)
    }

    function onScroll() {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = lastY.current - y
        if (delta > 30 || y <= 40) {
          triggerGlow()
        }
        lastY.current = y
        ticking.current = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // run once to set baseline
    lastY.current = window.scrollY

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timeoutId) window.clearTimeout(timeoutId)
      if (overlayRef.current) {
        overlayRef.current.remove()
        overlayRef.current = null
      }
      console.log('[SunriseOverlay] unmounted')
    }
  }, [])

  return null
}
