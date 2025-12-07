// src/components/ContactForm.tsx
'use client'

import { useEffect, useState } from 'react'

type Props = {
  contactEmail?: string
}

type FormState = {
  name: string
  email: string
  subject: string
  message: string
}

const STORAGE_KEY = 'contact:draft:v1'

export default function ContactForm({ contactEmail = 'hello@aurum.example' }: Props) {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // load draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setForm(JSON.parse(raw))
    } catch {}
  }, [])

  // autosave draft
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    } catch {}
  }, [form])

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }))
  }

  function validate(): string | null {
    if (!form.name.trim()) return 'Please enter your name.'
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email.'
    if (!form.subject.trim()) return 'Please add a subject.'
    if (!form.message.trim() || form.message.trim().length < 10) return 'Please write a longer message (10+ chars).'
    return null
  }

  function openMailClient() {
    const subject = encodeURIComponent(form.subject)
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const v = validate()
    if (v) {
      setError(v)
      return
    }

    setLoading(true)
    try {
      // if you have an API to post to, replace this block with a fetch() call.
      // For now we open the mail client and save as sent.
      openMailClient()
      setSent(true)
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      setError('Could not send message. Please try again or email us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Contact form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-muted">Name</span>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1 block w-full rounded-md bg-transparent border border-white/6 p-2" />
        </label>

        <label className="block">
          <span className="text-sm text-muted">Email</span>
          <input value={form.email} onChange={(e) => update('email', e.target.value)} className="mt-1 block w-full rounded-md bg-transparent border border-white/6 p-2" />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-muted">Subject</span>
        <input value={form.subject} onChange={(e) => update('subject', e.target.value)} className="mt-1 block w-full rounded-md bg-transparent border border-white/6 p-2" />
      </label>

      <label className="block">
        <span className="text-sm text-muted">Message</span>
        <textarea value={form.message} onChange={(e) => update('message', e.target.value)} rows={6} className="mt-1 block w-full rounded-md bg-transparent border border-white/6 p-2" />
      </label>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading || sent} className="btn-cta">
          {loading ? 'Sending…' : sent ? 'Check your email' : 'Send message'}
        </button>

        <button type="button" onClick={() => { setForm({ name: '', email: '', subject: '', message: '' }); localStorage.removeItem(STORAGE_KEY); }} className="rounded-md px-3 py-2 border border-white/6">
          Clear
        </button>
      </div>

      <div className="text-sm text-muted mt-2">
        By contacting us you agree to our <a href="/privacy" className="underline">Privacy Policy</a>. We typically respond within 1–2 business days.
      </div>
    </form>
  )
}
