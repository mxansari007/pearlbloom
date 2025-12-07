// src/components/SubscribeForm.tsx
'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'aurum:subscribed:v1'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      if (s === 'true') setDone(true)
    } catch {}
  }, [])

  function validateEmail(e: string) {
    return /^\S+@\S+\.\S+$/.test(e)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!validateEmail(email)) {
      setError('Please enter a valid email.')
      return
    }
    if (!consent) {
      setError('Please agree to receive occasional emails.')
      return
    }

    setLoading(true)
    try {
      // If you later add /api/subscribe, this will POST to it.
      // For now, we store locally and simulate success.
      // If an API exists, it should return 200 on success.
      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (!res.ok) throw new Error('api-failed')
      } catch {
        // fallback: save locally (dev / no-backend)
        const previous = JSON.parse(localStorage.getItem('aurum:subscribers') || '[]')
        if (!previous.includes(email)) {
          previous.push(email)
          localStorage.setItem('aurum:subscribers', JSON.stringify(previous))
        }
      }

      localStorage.setItem(STORAGE_KEY, 'true')
      setDone(true)
      showToast('Thanks — check your inbox for a welcome note.')
    } catch {
      setError('Could not subscribe. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Tiny in-DOM toast so we don't add another dependency
  function showToast(msg: string) {
    const el = document.createElement('div')
    el.textContent = msg
    el.style.position = 'fixed'
    el.style.right = '18px'
    el.style.bottom = '22px'
    el.style.background = 'rgba(0,0,0,0.8)'
    el.style.color = 'white'
    el.style.padding = '10px 14px'
    el.style.borderRadius = '10px'
    el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.6)'
    el.style.zIndex = '9999'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2600)
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <h3 className="font-display text-lg">You're subscribed</h3>
        <p className="text-sm text-muted mt-2">Thank you — we’ll keep you posted on new collections and exclusive previews.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2">
          <h3 className="font-display text-xl">Join our list</h3>
          <p className="text-sm text-muted mt-1">Get exclusive previews, early access and curated offers — one email per month.</p>
        </div>

        <div className="md:col-span-1">
          <label className="sr-only" htmlFor="subscribe-email">Email</label>
          <div className="flex gap-2">
            <input
              id="subscribe-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-md bg-transparent border border-white/6 p-2"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-cta"
              aria-disabled={loading}
            >
              {loading ? 'Joining…' : 'Join'}
            </button>
          </div>

          <label className="flex items-center gap-2 mt-3 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-muted">I agree to receive marketing emails.</span>
          </label>

          {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
        </div>
      </div>

      <div className="text-xs text-muted mt-4">
        By subscribing you agree to our <a href="/privacy" className="underline">Privacy Policy</a>. We never sell your data.
      </div>
    </form>
  )
}
