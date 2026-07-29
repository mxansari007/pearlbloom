// src/components/CollectionHero.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function CollectionHero({
  title,
  subtitle,
  description,
  image
}: {
  title: string
  subtitle?: string
  description?: string
  image?: string
}) {
  return (
    <section className="relative rounded-2xl overflow-hidden card">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
        <div className="p-5 sm:p-8 lg:p-12">
          <p className="kicker">Collections</p>
          <h1 className="text-3xl md:text-4xl font-display mt-2">{title}</h1>
          {subtitle && <p className="text-muted mt-2">{subtitle}</p>}
          {description && <p className="mt-4 text-base text-muted max-w-xl">{description}</p>}

          <div className="mt-6 flex gap-3">
            <a href="#browse" className="btn-cta">Browse collections</a>
            <Link href="/contact" className="rounded-md px-4 py-2 border border-white/6 hover:bg-white/2 transition text-sm">Custom design</Link>
          </div>

          <div className="mt-6 text-sm text-muted">
            <strong>Why Aurum?</strong> Ethically sourced gemstones, handcrafting by master jewelers, and lifetime care for every piece.
          </div>
        </div>

        <div className="relative h-72 lg:h-96 w-full">
          {image ? <Image src={image} alt={title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </div>
    </section>
  )
}
