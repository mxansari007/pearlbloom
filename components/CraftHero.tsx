// src/components/CraftHero.tsx
import Link from 'next/link'

export default function CraftHero({
  title,
  subtitle,
  image
}: {
  title: string
  subtitle?: string
  image?: string
}) {
  return (
    <section className="card overflow-hidden rounded-2xl relative">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-10">
          <p className="text-sm text-muted uppercase tracking-wide">Our craft</p>
          <h1 className="text-3xl md:text-4xl font-display mt-3">{title}</h1>
          {subtitle && <p className="text-muted mt-4 max-w-lg">{subtitle}</p>}

          <div className="mt-6 flex gap-3">
            <Link href="/contact" className="btn-cta">Book a consultation</Link>
            <a href="#process" className="rounded-md px-4 py-2 border border-white/6 hover:bg-white/2 transition text-sm">See our process</a>
          </div>

          <p className="text-sm text-muted mt-4">Lead times and custom options available — consult our specialists for details.</p>
        </div>

        <div className="relative h-64 lg:h-96 w-full">
          <img src={"https://plus.unsplash.com/premium_photo-1663956023982-39e6ed985e45?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"} alt="Studio hero" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </div>
    </section>
  )
}
