'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useProductVariant } from '../hooks/useProductVariant'

type Props = {
  images?: string[]
  alt?: string
}

export default function ProductGallery({ images = [], alt = '' }: Props) {
  const { selectedVariant } = useProductVariant()
  const variantSelected = !!selectedVariant
  const currentImages = variantSelected
    ? (selectedVariant?.images ?? [])
    : (images ?? [])
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, currentImages.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, currentImages.length])

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const safeIndex = Math.min(index, Math.max(0, currentImages.length - 1))

  if (!currentImages.length) {
    return (
      <div className="gallery-empty">
        <svg className="w-16 h-16 text-muted opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-muted mt-3">No images available</p>
      </div>
    )
  }

  function openAt(i: number) {
    setIndex(i)
    setOpen(true)
  }

  function next(e?: React.MouseEvent) {
    e?.stopPropagation()
    setIndex((i) => (i + 1) % currentImages.length)
  }

  function prev(e?: React.MouseEvent) {
    e?.stopPropagation()
    setIndex((i) => (i - 1 + currentImages.length) % currentImages.length)
  }

  return (
    <div className="gallery">
      {/* Main Image */}
      <div className="gallery__main">
        <button
          onClick={() => openAt(safeIndex)}
          aria-label="Open image in lightbox"
          className="gallery__main-btn"
        >
          <div className="gallery__main-image">
            <Image
              key={currentImages[safeIndex]}
              src={currentImages[safeIndex]}
              alt={alt || `Product image ${index + 1}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            {/* Zoom indicator */}
            <div className="gallery__zoom-hint">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <span>Click to zoom</span>
            </div>
          </div>
        </button>

        {/* Navigation arrows on main image */}
        {currentImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous image"
              className="gallery__nav gallery__nav--prev"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next image"
              className="gallery__nav gallery__nav--next"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image counter */}
        {currentImages.length > 1 && (
          <div className="gallery__counter">
            {safeIndex + 1} / {currentImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {currentImages.length > 1 && (
        <div className="gallery__thumbs">
          {currentImages.map((src, i) => (
            <button
              key={src}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === safeIndex}
              className={`gallery__thumb ${i === safeIndex ? 'gallery__thumb--active' : ''}`}
            >
              <Image
                src={src}
                alt={alt || `Thumbnail ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="lightbox"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop blur */}
          <div className="lightbox__backdrop" />

          {/* Content */}
          <div
            className="lightbox__content"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className={`lightbox__image ${isZoomed ? 'lightbox__image--zoomed' : ''}`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <Image
                key={currentImages[safeIndex]}
                src={currentImages[safeIndex]}
                alt={alt || `Product image ${index + 1}`}
                fill
                sizes="100vw"
                className={`object-contain transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
              />
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close lightbox"
              className="lightbox__close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation */}
            {currentImages.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Previous image"
                  className="lightbox__nav lightbox__nav--prev"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  aria-label="Next image"
                  className="lightbox__nav lightbox__nav--next"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Thumbnails in lightbox */}
            {currentImages.length > 1 && (
              <div className="lightbox__thumbs">
                {currentImages.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setIndex(i)}
                    className={`lightbox__thumb ${i === safeIndex ? 'lightbox__thumb--active' : ''}`}
                  >
                    <Image
                      src={src}
                      alt={`Thumbnail ${i + 1}`}
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
