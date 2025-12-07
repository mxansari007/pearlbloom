// src/components/ProductActions.tsx
'use client'

import { useEffect, useState } from 'react'
import type { Product } from '../types/products'

export default function ProductActions({ product }: { product: Product }) {
  const [inWishlist, setInWishlist] = useState(false)
  const storageKey = `wishlist:${product.id}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      setInWishlist(!!raw)
    } catch {
      setInWishlist(false)
    }
  }, [storageKey])

  function copyLink() {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      // non-blocking UI toast
      const el = document.createElement('div')
      el.textContent = 'Link copied'
      el.style.position = 'fixed'
      el.style.bottom = '20px'
      el.style.right = '20px'
      el.style.padding = '8px 12px'
      el.style.background = 'rgba(0,0,0,0.7)'
      el.style.color = 'white'
      el.style.borderRadius = '8px'
      el.style.zIndex = '9999'
      document.body.appendChild(el)
      setTimeout(() => document.body.removeChild(el), 1400)
    }
  }

  function toggleWishlist() {
    try {
      if (inWishlist) {
        localStorage.removeItem(storageKey)
        setInWishlist(false)
      } else {
        localStorage.setItem(storageKey, JSON.stringify(product))
        setInWishlist(true)
      }
    } catch {
      // ignore storage errors
    }
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={copyLink}
        className="rounded-full border border-white/6 px-3 py-2 hover:bg-white/2 transition text-sm"
        type="button"
        aria-label="Copy product link"
      >
        Copy link
      </button>

      <button
        onClick={toggleWishlist}
        className="rounded-full border border-white/6 px-3 py-2 hover:bg-white/2 transition text-sm"
        type="button"
        aria-pressed={inWishlist}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {inWishlist ? '♥ In wishlist' : '♡ Add to wishlist'}
      </button>
    </div>
  )
}
