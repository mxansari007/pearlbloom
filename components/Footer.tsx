export default function Footer() {
  return (
    <footer className="border-t border-white/6 mt-16">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-display text-xl">Aurum</h3>
          <p className="text-sm text-muted mt-3 max-w-sm">Heirloom quality jewelry handcrafted with care. Lifetime polishing & maintenance available.</p>
        </div>

        <div>
          <h5 className="font-semibold">Explore</h5>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Collections</li>
            <li>Our Craft</li>
            <li>Care & Warranty</li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold">Contact</h5>
          <p className="text-sm text-muted mt-3">hello@aurum.example<br/>+91 98765 43210</p>
          <div className="flex gap-3 mt-4">
            <a aria-label="Instagram" href="#" className="w-9 h-9 rounded-full bg-white/4 flex items-center justify-center">ig</a>
            <a aria-label="Pinterest" href="#" className="w-9 h-9 rounded-full bg-white/4 flex items-center justify-center">pt</a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/4 py-6 text-center text-sm text-muted">
        © {new Date().getFullYear()} Aurum. All rights reserved.
      </div>
    </footer>
  )
}
