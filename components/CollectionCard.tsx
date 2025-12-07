'use client'

import { useState } from 'react'

export default function CollectionCard({
  title,
  image,
}: {
  title: string
  image: string
}) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="
        card relative overflow-hidden rounded-xl cursor-pointer
        transition-all duration-500
      "
      style={{
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        borderColor: hover ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.04)',
      }}
    >
      {/* ✨ Sparkle Layer */}
      <div
        className="
          absolute inset-0 pointer-events-none
          transition-opacity duration-600
        "
        style={{
          opacity: hover ? 0.6 : 0,
          backgroundImage: `
            radial-gradient(circle at 20% 25%, rgba(212,175,55,0.25), transparent 60%),
            radial-gradient(circle at 70% 65%, rgba(212,175,55,0.18), transparent 65%),
            radial-gradient(circle at 40% 80%, rgba(212,175,55,0.12), transparent 55%)
          `,
          filter: hover ? 'blur(8px)' : 'blur(12px)',
        }}
      />

      {/* ✨ Floating micro-sparkles */}
      <div
        className="absolute inset-0 pointer-events-none sparkle-layer"
        style={{ opacity: hover ? 0.8 : 0 }}
      />

      {/* Image */}
      <div className="relative w-full h-52 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="
            w-full h-full object-cover
            transition-all duration-700 ease-out
          "
          style={{
            transform: hover ? 'scale(1.08)' : 'scale(1)',
            filter: hover ? 'brightness(1.15)' : 'brightness(1)',
          }}
        />

        {/* soft gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 relative z-10">
        <h3
          className="font-medium text-lg font-display transition-colors duration-500"
          style={{
            color: hover ? `rgb(var(--gold-rgb))` : 'var(--fg)',
          }}
        >
          {title}
        </h3>

        <p
          className="text-sm text-muted mt-2 transition-all duration-500"
          style={{
            opacity: hover ? 1 : 0.7,
            transform: hover ? 'translateY(0)' : 'translateY(3px)',
          }}
        >
          Explore the collection →
        </p>
      </div>
    </div>
  )
}
