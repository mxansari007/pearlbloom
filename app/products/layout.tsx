// src/app/products/[slug]/layout.tsx
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import type { Product } from '../../types/products'
import { getProductBySlug } from '../../libs/products'

type ParamsLike = { slug?: string } | Promise<{ slug?: string }>

export default async function ProductLayout({ children, params }: { children: ReactNode; params: ParamsLike }) {
  // always await params (handles Promise or plain object)
  const { slug } = (await params) as { slug?: string }

  // If slug is missing, do NOT call notFound — simply render children or a placeholder.
  // This prevents an early 404 when params is still resolving.
  if (!slug) {
    console.warn('[ProductLayout] slug missing; rendering fallback layout until page resolves')
    return (
      <div>
        {/* Minimal shell while slug resolves */}
        <main>{children}</main>
      </div>
    )
  }

  // Now slug exists; fetch product and only call notFound if slug present and product missing
  const product: Product | undefined = await getProductBySlug(slug)
  if (!product) {
    console.log('[ProductLayout] product not found for slug -> notFound():', slug)
    notFound()
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate-500">
        <a href="/">Home</a> / <a href="/products">Catalogue</a> / <span>{product.title}</span>
      </nav>

      <header>
        <h1 className="text-2xl font-bold">{product.title}</h1>
        {product.brand && <p className="text-sm text-slate-600">{product.brand}</p>}
      </header>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">{children}</div>
        <aside className="md:col-span-1">
          <div>Price: {product.price ? `₹${product.price}` : '—'}</div>
        </aside>
      </section>
    </div>
  )
}
