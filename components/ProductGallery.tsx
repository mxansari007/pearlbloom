'use client'

import { useEffect, useState, useRef, useCallback, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useProductVariant } from '../hooks/useProductVariant'
import { ChevronLeft, ChevronRight, ZoomIn, X, Play } from 'lucide-react'

type Props = {
  images?: string[]
  alt?: string
  imageAlt?: Record<string, string>
  youtubeVideoUrl?: string
  videoThumbnailImage?: string
  videoThumbnailAltText?: string
}

export default function ProductGallery({ images = [], alt = '', imageAlt = {}, youtubeVideoUrl, videoThumbnailImage, videoThumbnailAltText }: Props) {
  const altFor = (src: string, fallback: string) => imageAlt[src]?.trim() || alt || fallback
  const { selectedVariant } = useProductVariant()
  const variantSelected = !!selectedVariant
  const currentImages = variantSelected
    ? (selectedVariant?.images ?? [])
    : (images ?? [])
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  const hasVideo = !variantSelected && !!youtubeVideoUrl && !!videoThumbnailImage
  const videoIndex = currentImages.length
  const totalSlides = currentImages.length + (hasVideo ? 1 : 0)

  function getYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ]
    for (const p of patterns) {
      const m = url.match(p)
      if (m) return m[1]
    }
    return null
  }

  const videoId = youtubeVideoUrl ? getYouTubeVideoId(youtubeVideoUrl) : null
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  
  // Touch handling
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  const minSwipeDistance = 50

  const imageSetKey = `${variantSelected}:${currentImages.join('|')}`
  const [previousImageSetKey, setPreviousImageSetKey] = useState(imageSetKey)
  if (previousImageSetKey !== imageSetKey) {
    setPreviousImageSetKey(imageSetKey)
    setIndex(0)
    setIsZoomed(false)
  }

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

  const safeIndex = Math.min(index, Math.max(0, totalSlides - 1))

  const next = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIndex((i) => (i + 1) % totalSlides)
  }, [totalSlides])

  const prev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIndex((i) => (i - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

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
    if (hasVideo && i === videoIndex) return
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
          <div className="gallery__main-image">
            <div
              className="gallery__track"
              style={{
                transform: `translate3d(calc(${-safeIndex * 100}% + ${isDragging ? dragOffset : 0}px), 0, 0)`,
                transition: isDragging
                  ? 'none'
                  : 'transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1)',
              }}
            >
              {currentImages.map((src, i) => (
                <div className="gallery__slide" key={`${src}-${i}`}>
                  <Image
                    src={src}
                    alt={altFor(src, `Product image ${i + 1}`)}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    draggable={false}
                  />
                </div>
              ))}
              {hasVideo && (
                <div className="gallery__slide" key="video-slide">
                  {showVideo && videoId ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                      title={videoThumbnailAltText || "Product video"}
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={videoThumbnailImage!}
                        alt={videoThumbnailAltText || "Product video thumbnail"}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain"
                        draggable={false}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowVideo(true) }}
                        aria-label="Play product video"
                        className="absolute z-10 flex items-center justify-center w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                      >
                        <Play size={28} className="ml-0.5" fill="white" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Zoom Hint - Hidden on touch devices */}
        <div className="gallery__zoom-hint">
          <ZoomIn size={16} />
          <span>Tap to zoom</span>
        </div>

        {/* Navigation arrows */}
        {totalSlides > 1 && (
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
        {totalSlides > 1 && (
          <div className="gallery__dots">
            {Array.from({ length: totalSlides }).map((_, i) => (
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
        {totalSlides > 1 && (
          <div className="gallery__swipe-hint">
            <ChevronLeft size={14} />
            <span>Swipe</span>
            <ChevronRight size={14} />
          </div>
        )}
      </div>

      {/* Thumbnails (hidden on very small screens) */}
      {totalSlides > 1 && (
        <div className="gallery__thumbs">
          {currentImages.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === safeIndex}
              className={`gallery__thumb ${i === safeIndex ? 'gallery__thumb--active' : ''}`}
            >
              <Image
                src={src}
                alt={altFor(src, `Thumbnail ${i + 1}`)}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
          {hasVideo && (
            <button
              key="video-thumb"
              onClick={() => { setIndex(videoIndex); setShowVideo(false) }}
              aria-label="View product video"
              aria-pressed={safeIndex === videoIndex}
              className={`gallery__thumb relative ${safeIndex === videoIndex ? 'gallery__thumb--active' : ''}`}
            >
              <Image
                src={videoThumbnailImage!}
                alt={videoThumbnailAltText || "Video thumbnail"}
                fill
                sizes="80px"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play size={16} fill="white" className="text-white" />
              </div>
            </button>
          )}
        </div>
      )}

      {/* Lightbox — portaled to <body> so the sticky gallery's stacking
          context can't trap it beneath the page's description card */}
      {open && mounted && createPortal(
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
                alt={altFor(currentImages[safeIndex], `Product image ${safeIndex + 1}`)}
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
                    key={`${src}-${i}`}
                    onClick={() => setIndex(i)}
                    className={`lightbox__thumb ${i === safeIndex ? 'lightbox__thumb--active' : ''}`}
                  >
                    <Image
                      src={src}
                      alt={altFor(src, `Thumbnail ${i + 1}`)}
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
