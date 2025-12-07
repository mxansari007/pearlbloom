// src/components/CraftCTA.tsx
import Link from 'next/link'

export default function CraftCTA() {
  return (
    <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <h3 className="font-display text-lg">Ready to make something beautiful?</h3>
        <p className="text-sm text-muted mt-2">Book a free consultation or request an estimate for a custom piece.</p>
      </div>

      <div className="flex gap-3">
        <Link href="/contact" className="btn-cta">Book consultation</Link>
        <Link href="/contact" className="rounded-md px-4 py-2 border border-white/6 hover:bg-white/2 transition text-sm">Request estimate</Link>
      </div>
    </div>
  )
}
