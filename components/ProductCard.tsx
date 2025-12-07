// src/components/ProductCard.tsx
import Link from 'next/link'
import type { Product } from '../types/products'

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.png'
  return (
    <article className="product-card card overflow-hidden rounded-2xl">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="product-card__media">
          <img src={image} alt={product.title} className="product-card__img" />
        </div>

        <div className="product-card__body p-4">
          <h3 className="product-card__title">{product.title}</h3>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              {product.price ? (
                <div className="product-card__price">₹{product.price.toLocaleString()}</div>
              ) : (
                <div className="product-card__price text-muted">Price on request</div>
              )}
            </div>

            <div className="product-card__badges">
              {/* potential badges (stock, bestseller) */}
            </div>
          </div>
        </div>
      </Link>

      <div className="product-card__actions p-4 border-t border-white/6">
        <div className="flex gap-3">
          <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-2 rounded-md px-3 py-2 border border-white/6 hover:bg-white/2 transition text-sm">
            View
          </Link>

          {/* Buy is external — will be rendered conditionally by marketplace link if you have one; fallback is disabled anchor */}
          {product.marketplaces?.amazon || product.marketplaces?.flipkart || product.marketplaces?.meesho ? (
            // prefer Amazon if available, fallback order Flipkart -> Meesho
            <a
              href={product.marketplaces?.amazon ?? product.marketplaces?.flipkart ?? product.marketplaces?.meesho}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta ml-auto"
            >
              Buy
            </a>
          ) : (
            <Link href="/contact" className="btn-cta ml-auto">
              Enquire
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
