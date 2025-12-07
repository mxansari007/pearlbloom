export default function Hero() {
  return (
    <section className="py-20">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 max-w-xl">
          <p className="kicker text-muted">New Arrival</p>
          <h1 className="text-5xl md:text-6xl font-display leading-tight">Timeless Jewelry<br/>Crafted to Last</h1>
          <p className="text-lg text-muted">Discover masterfully handcrafted pieces, ethically sourced gemstones, and lifetime care.</p>
          <div className="flex items-center gap-4 mt-4">
            <a href="/products" className="btn-cta">Explore Collection</a>
            <a href="/about" className="text-sm text-muted hover:underline">Our Story</a>
          </div>
          <div className="flex gap-8 mt-8 text-sm">
            <div><div className="text-xl font-semibold">500+</div><div className="text-muted">Happy customers</div></div>
            <div><div className="text-xl font-semibold">15 yrs</div><div className="text-muted">Master craftsmanship</div></div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl overflow-hidden card">
            <div className="img-wrap">
              <img
                src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Elegant jewelry"
                className="w-full h-[520px] object-cover hero-float"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
