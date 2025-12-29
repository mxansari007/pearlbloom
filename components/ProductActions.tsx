'use client'

import { useState } from 'react'
import type { Product, Variant } from '../types/products'
import { useWishlistStore } from '@/store/useWishlistStore'
import { getFinalPrice, getStartingPrice } from '../libs/pricing'

export default function ProductActions({
  product,
  selectedVariant,
}: {
  product: Product
  selectedVariant?: Variant
}) {
  const toggleWishlistStore = useWishlistStore((s) => s.toggle)
  const isWishlisted = useWishlistStore((s) =>
    s.items.some((i) => i.id === product.id)
  )
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  function showNotification(message: string) {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  function copyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showNotification('Link copied to clipboard')
    }
  }

  function toggleWishlist() {
    const basePrice =
      selectedVariant
        ? getFinalPrice(selectedVariant)
        : getStartingPrice(product.variants) ?? 0

    toggleWishlistStore({
      id: product.id,
      name: product.name,
      price: basePrice,
      image:
        selectedVariant?.images?.[0] ??
        product.thumbnailUrl ??
        product.images?.[0],
      slug: product.slug,
    })

    showNotification(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  function shareProduct() {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Pearl Bloom`,
        url: window.location.href,
      })
    } else {
      copyLink()
    }
  }

  return (
    <>
      <div className="product-actions">
        <button
          type="button"
          onClick={toggleWishlist}
          aria-pressed={isWishlisted}
          className={`product-actions__btn ${isWishlisted ? 'product-actions__btn--active' : ''}`}
        >
          <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{isWishlisted ? 'Saved' : 'Save'}</span>
        </button>

        <button
          type="button"
          onClick={shareProduct}
          className="product-actions__btn"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Share</span>
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="product-actions__btn"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Copy Link</span>
        </button>
      </div>

      {/* Toast Notification */}
      <div className={`toast ${showToast ? 'toast--visible' : ''}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>{toastMessage}</span>
      </div>
    </>
  )
}
