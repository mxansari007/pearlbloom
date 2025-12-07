// src/components/BeforeAfterGallery.tsx
'use client'
import { useState } from 'react'

const examples = [
  { before: 'https://images.unsplash.com/photo-1553456558-aff63285bdd2?q=80&w=1200&auto=format&fit=crop', after: 'https://images.unsplash.com/photo-1518544882249-2b7a1f9b6b63?q=80&w=1200&auto=format&fit=crop', title: 'Restoration' },
  { before: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1200&auto=format&fit=crop', after: 'https://images.unsplash.com/photo-1517148815978-75f6acaaff84?q=80&w=1200&auto=format&fit=crop', title: 'Custom refit' }
]

export default function BeforeAfterGallery() {
  const [idx, setIdx] = useState(0)
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2 card p-4">
        <div className="relative">
          <img src={examples[idx].before} alt="before" className="w-full h-64 object-cover opacity-90 rounded-md" loading="lazy" />
          <div className="absolute top-3 right-3 bg-white/6 rounded-full px-3 py-1 text-sm">{examples[idx].title}</div>
          <div className="mt-3 text-sm text-muted">Swipe to see difference (demo images). Replace with real before/after shots.</div>
        </div>
      </div>

      <aside className="space-y-2">
        {examples.map((ex, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`card p-2 w-full text-left ${i===idx ? 'border-[rgba(212,175,55,0.14)]' : ''}`}>
            <div className="font-medium">{ex.title}</div>
          </button>
        ))}
      </aside>
    </div>
  )
}
