// src/components/TechniqueShowcase.tsx
'use client'
import { useState } from 'react'

const items = [
  { title: 'Hand engraving', src: 'https://images.unsplash.com/photo-1518544882249-2b7a1f9b6b63?q=80&w=1200&auto=format&fit=crop' },
  { title: 'Stone setting', src: 'https://images.unsplash.com/photo-1517148815978-75f6acaaff84?q=80&w=1200&auto=format&fit=crop' },
  { title: 'Polishing & finish', src: 'https://images.unsplash.com/photo-1526378726430-4c40a63a9e59?q=80&w=1200&auto=format&fit=crop' }
]

export default function TechniqueShowcase() {
  const [i, setI] = useState(0)
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 card p-4">
        <img src={items[i].src} alt={items[i].title} className="w-full h-64 object-cover rounded-md" loading="lazy" />
        <h3 className="mt-4 font-medium">{items[i].title}</h3>
        <p className="text-sm text-muted mt-2">Short explanation about the technique and why it matters for durability & beauty.</p>
      </div>

      <aside className="space-y-3">
        {items.map((it, idx) => (
          <button key={it.title} onClick={() => setI(idx)} className={`w-full text-left card p-3 ${i===idx? 'border-[rgba(212,175,55,0.18)]' : ''}`}>
            <div className="font-medium">{it.title}</div>
            <p className="text-sm text-muted mt-1">See an example</p>
          </button>
        ))}
      </aside>
    </div>
  )
}
