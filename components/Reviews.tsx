// src/components/Reviews.tsx
'use client'

import { useEffect, useState } from 'react'

type Review = {
  id: string
  name: string
  rating: number
  text: string
  date: string
}

function sampleReviews(): Review[] {
  return [
    { id: 'r1', name: 'Rhea S.', rating: 5, text: "Stunning piece — the diamond shines brilliantly. Packaging and service were top notch.", date: new Date().toISOString() },
    { id: 'r2', name: 'Amit K.', rating: 5, text: "Beautiful craftsmanship; the ring feels exquisite and secure.", date: new Date().toISOString() }
  ]
}

export default function Reviews({ productId }: { productId: string }) {
  const storageKey = `reviews:${productId}`
  const [reviews, setReviews] = useState<Review[]>([])
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      try {
        setReviews(JSON.parse(raw))
        return
      } catch {}
    }
    // seed with sample reviews only if none exist
    localStorage.setItem(storageKey, JSON.stringify(sampleReviews()))
    setReviews(sampleReviews())
  }, [storageKey])

  function saveReview(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !text) {
      alert('Please add your name and review')
      return
    }
    const r: Review = { id: `${Date.now()}`, name, rating, text, date: new Date().toISOString() }
    const next = [r, ...reviews]
    setReviews(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    setName(''); setText(''); setRating(5)
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Average rating</div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < Math.round(avg) ? 'rgb(212,175,55)' : 'none'} stroke="currentColor" className="mr-1">
                  <path d="M12 .587l3.668 7.431L24 9.748l-6 5.84 1.42 8.28L12 19.771 4.58 23.868 6 15.588 0 9.748l8.332-1.73z" />
                </svg>
              ))}
            </div>
            <div className="text-sm text-muted">{avg ? avg.toFixed(1) : 'No ratings yet'}</div>
          </div>
        </div>

        <div>
          <button onClick={() => {
            const el = document.getElementById('review-form') as HTMLFormElement | null
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }} className="btn-cta">Write a review</button>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/6 flex items-center justify-center text-sm">{r.name.charAt(0)}</div>
              <div>
                <div className="flex items-center gap-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-sm text-muted">{new Date(r.date).toLocaleDateString()}</div>
                </div>
                <div className="mt-2 text-sm">{r.text}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add review form */}
      <form id="review-form" onSubmit={saveReview} className="space-y-3 card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="p-2 rounded-md bg-transparent border border-white/6" />
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="p-2 rounded-md bg-transparent border border-white/6">
            <option value={5}>5 - Excellent</option>
            <option value={4}>4 - Great</option>
            <option value={3}>3 - Good</option>
            <option value={2}>2 - Fair</option>
            <option value={1}>1 - Poor</option>
          </select>
          <div className="text-sm text-muted">All reviews are moderated before publishing.</div>
        </div>

        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your review..." rows={4} className="w-full p-3 rounded-md bg-transparent border border-white/6" />

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-cta">Submit review</button>
          <button type="button" onClick={() => { setName(''); setText(''); setRating(5) }} className="rounded-md px-3 py-2 border border-white/6">Reset</button>
        </div>
      </form>
    </div>
  )
}
