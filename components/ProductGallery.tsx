// src/components/ProductGallery.tsx
'use client'

import { useEffect, useState } from 'react'

export default function ProductGallery({ images = [], alt = '' }: { images?: string[]; alt?: string }) {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, images.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, images.length])

  if (!images || images.length === 0) {
    return (
      <div className="card p-4 flex items-center justify-center" aria-hidden>
        <div className="text-center text-muted">No images available</div>
      </div>
    )
  }

  function openAt(i: number) {
    setIndex(i)
    setOpen(true)
  }

  function next() {
    setIndex((i) => (i + 1) % images.length)
  }
  function prev() {
    setIndex((i) => (i - 1 + images.length) % images.length)
  }

  return (
    <div>
      {/* Main image */}
      <div className="card overflow-hidden">
        <button
          onClick={() => openAt(index)}
          aria-label="Open image in lightbox"
          className="w-full block"
          style={{ display: 'block' }}
        >
          <div className="img-wrap">
            <img
              src={images[index]}
              alt={alt || `Product image ${index + 1}`}
              className="w-full h-[520px] object-cover"
              style={{ display: 'block' }}
            />
          </div>
        </button>
      </div>

      {/* Thumbnails */}
      <div className="mt-4 flex gap-3">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`rounded-md overflow-hidden border ${i === index ? 'ring-2 ring-[rgba(212,175,55,0.2)]' : 'border-white/6'}`}
            aria-pressed={i === index}
          >
            <img src={src} alt={alt || `Thumbnail ${i + 1}`} className="w-20 h-20 object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-w-[92vw] max-h-[92vh] relative"
            onClick={(e) => e.stopPropagation()}
            aria-label="Image viewer"
          >
            <img src={images[index]} alt={alt || `Product image ${index + 1}`} className="max-w-full max-h-[80vh] object-contain rounded-md" />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 rounded-full p-2 bg-white/6 hover:bg-white/10"
            >
              ✕
            </button>

            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-3 bg-white/6 hover:bg-white/10"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-3 bg-white/6 hover:bg-white/10"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
