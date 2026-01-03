'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useProductVariant } from '../hooks/useProductVariant'
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react'

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
  
  // Touch handling
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  const minSwipeDistance = 50

  // Reset index when images change
  useEffect(() => {
    setIndex(0)
  }, [currentImages.length, variantSelected])

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

  const next = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIndex((i) => (i + 1) % currentImages.length)
  }, [currentImages.length])

  const prev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIndex((i) => (i - 1 + currentImages.length) % currentImages.length)
  }, [currentImages.length])

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null
    touchStartX.current = e.targetTouches[0].clientX
    setIsDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return
    touchEndX.current = e.targetTouches[0].clientX
    const diff = touchEndX.current - touchStartX.current
    // Limit drag offset
    const maxDrag = 100
    setDragOffset(Math.max(-maxDrag, Math.min(maxDrag, diff)))
  }

  const onTouchEnd = () => {
    setIsDragging(false)
    setDragOffset(0)
    
    if (!touchStartX.current || !touchEndX.current) return
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentImages.length > 1) {
      next()
    }
    if (isRightSwipe && currentImages.length > 1) {
      prev()
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  function openAt(i: number) {
    setIndex(i)
    setOpen(true)
  }

  if (!currentImages.length) {
    return (
      <div className="gallery-empty">
        <svg className="w-16 h-16 opacity-40" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-3" style={{ color: 'var(--muted)' }}>No images available</p>
      </div>
    )
  }

  return (
    <div className="gallery">
      {/* Main Image with Swipe Support */}
      <div 
        ref={containerRef}
        className="gallery__main"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button
          onClick={() => openAt(safeIndex)}
          aria-label="Open image in lightbox"
          className="gallery__main-btn"
        >
          <div 
            className="gallery__main-image"
            style={{
              transform: isDragging ? `translateX(${dragOffset}px)` : 'translateX(0)',
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            <Image
              key={currentImages[safeIndex]}
              src={currentImages[safeIndex]}
              alt={alt || `Product image ${safeIndex + 1}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              draggable={false}
            />
          </div>
        </button>

        {/* Zoom Hint - Hidden on touch devices */}
        <div className="gallery__zoom-hint">
          <ZoomIn size={16} />
          <span>Tap to zoom</span>
        </div>

        {/* Navigation arrows */}
        {currentImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous image"
              className="gallery__nav gallery__nav--prev"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next image"
              className="gallery__nav gallery__nav--next"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dots indicator (mobile-friendly) */}
        {currentImages.length > 1 && (
          <div className="gallery__dots">
            {currentImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                aria-label={`Go to image ${i + 1}`}
                className={`gallery__dot ${i === safeIndex ? 'gallery__dot--active' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Swipe hint for mobile */}
        {currentImages.length > 1 && (
          <div className="gallery__swipe-hint">
            <ChevronLeft size={14} />
            <span>Swipe</span>
            <ChevronRight size={14} />
          </div>
        )}
      </div>

      {/* Thumbnails (hidden on very small screens) */}
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
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
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
              style={{
                transform: isDragging && !isZoomed ? `translateX(${dragOffset}px)` : 'translateX(0)',
                transition: isDragging ? 'none' : 'transform 0.3s ease-out',
              }}
            >
              <Image
                key={currentImages[safeIndex]}
                src={currentImages[safeIndex]}
                alt={alt || `Product image ${safeIndex + 1}`}
                fill
                sizes="100vw"
                className={`object-contain transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                draggable={false}
              />
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close lightbox"
              className="lightbox__close"
            >
              <X size={24} />
            </button>

            {/* Navigation */}
            {currentImages.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Previous image"
                  className="lightbox__nav lightbox__nav--prev"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={next}
                  aria-label="Next image"
                  className="lightbox__nav lightbox__nav--next"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="lightbox__counter">
              {safeIndex + 1} / {currentImages.length}
            </div>

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
