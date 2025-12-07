// src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Product } from '../../../types/products'
import { getProductBySlug, getAllSlugs } from '../../../libs/products'
import ProductGallery from '../../../components/ProductGallery'
import RelatedProducts from '../../../components/RelatedProducts'
import Reviews from '../../../components/Reviews'
import ProductActions from '../../../components/ProductActions'


// types
type ParamsLike = { slug?: string } | Promise<{ slug?: string }>

export async function generateMetadata({ params: paramsArg }: { params: ParamsLike }) {
  // always await params to handle both Promise and plain object
  const { slug } = (await paramsArg) as { slug?: string }

  // early fallback if missing slug
  if (!slug) return { title: 'Product not found — Aurum' }

  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found — Aurum' }

  return {
    title: `${product.title} — Aurum`,
    description: product.description ?? '',
    openGraph: {
      title: product.title,
      description: product.description ?? '',
      images: product.images?.length ? product.images : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: ParamsLike }) {
  const { slug } = (await params) as { slug?: string }
  if (!slug) notFound()

  const product: Product | undefined = await getProductBySlug(slug)
  if (!product) notFound()

  const images = product.images && product.images.length ? product.images : ['/images/placeholder.png']

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? '',
    sku: product.sku ?? product.id,
    image: images,
    offers: (product.marketplaces)
      ? Object.entries(product.marketplaces).map(([k, url]) => ({
          '@type': 'Offer',
          url,
          priceCurrency: 'INR',
          price: product.price ?? '',
          seller: { name: k.charAt(0).toUpperCase() + k.slice(1) }
        }))
      : undefined
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Gallery left */}
          <div>
            <ProductGallery images={images} alt={product.title} />
          </div>

          {/* Details right */}
          <div className="space-y-6">
            {/* Title + brand */}
            <div>
              {/* Reduced heading sizes to be professional and balanced */}
              <h1 className="text-2xl md:text-3xl font-display leading-tight">{product.title}</h1>
              {product.brand && <div className="text-sm text-muted mt-1">{product.brand}</div>}
            </div>

            {/* Price */}
            <div>
              {product.price ? (
                <div className="text-xl md:text-2xl font-semibold">₹{product.price.toLocaleString()}</div>
              ) : (
                <div className="text-base text-muted">Price on request</div>
              )}
            </div>

            {/* Short description */}
            {product.description && <p className="text-base text-muted max-w-xl">{product.description}</p>}

            {/* Marketplace Buttons */}
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              {product.marketplaces?.amazon && (
                <a href={product.marketplaces.amazon} target="_blank" rel="noopener noreferrer" className="btn-cta inline-flex items-center gap-2">
                  Buy on Amazon
                </a>
              )}
              {product.marketplaces?.flipkart && (
                <a href={product.marketplaces.flipkart} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md px-4 py-2 border border-white/6 hover:bg-white/2 transition text-sm">
                  Buy on Flipkart
                </a>
              )}
              {product.marketplaces?.meesho && (
                <a href={product.marketplaces.meesho} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md px-4 py-2 border border-white/6 hover:bg-white/2 transition text-sm">
                  Buy on Meesho
                </a>
              )}

              {!product.marketplaces && <div className="text-sm text-muted">Not listed on marketplaces yet — contact us for purchase options.</div>}
            </div>

{/* Quick actions (client) */}
<ProductActions product={product} />


            {/* Extra details (if present) */}
            <div className="text-sm text-muted mt-4">
              {product.metal && <div><strong>Metal:</strong> {product.metal}</div>}
              {product.gemstone && <div className="mt-1"><strong>Gemstone:</strong> {product.gemstone}</div>}
              <div className="mt-1"><strong>SKU:</strong> {product.sku ?? product.id}</div>
            </div>
          </div>
        </div>

        {/* Horizontal separator */}
        <div className="my-12 border-t border-white/6" />

        {/* Reviews */}
        <section aria-labelledby="reviews-title" className="mb-12">
          <h2 id="reviews-title" className="text-xl font-display mb-4">Customer reviews</h2>
          <Reviews productId={product.id} />
        </section>

        {/* Related / suggested products */}
        <section aria-labelledby="you-may-like" className="mb-12">
          <h2 id="you-may-like" className="text-xl font-display mb-6">You may also like</h2>
          {/* RelatedProducts is server component that renders ProductCard list */}
          <RelatedProducts currentSlug={product.slug} />
        </section>
      </div>
    </>
  )
}
