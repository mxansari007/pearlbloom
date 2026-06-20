// src/app/collections/page.tsx
export const revalidate = 60;

import type { Metadata } from 'next'
import { getAllProducts, attachRatings } from '../../libs/products.server'
import CollectionHero from '../../components/CollectionHero'
import CollectionBrowser from '../../components/CollectionBrowser'
import type { Product } from '../../types/products'

export const metadata: Metadata = {
  title: 'Shop All Earrings | Pearl Bloom',
  description:
    'Browse the full Pearl Bloom collection of affordable, anti-tarnish, skin-safe artificial earrings for women — studs, hoops, jhumkas, chandbalis and more. Filter by style, finish, price and sort.',
  keywords: ['earrings for women', 'artificial earrings', 'anti-tarnish earrings', 'gold-plated earrings', 'Pearl Bloom'],
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'Shop All Earrings | Pearl Bloom',
    description: 'Affordable, anti-tarnish, skin-safe artificial earrings for women — studs, hoops, jhumkas and more.',
    url: '/products',
    siteName: 'Pearl Bloom',
    type: 'website',
    images: [{ url: '/earring.png', width: 665, height: 597, alt: 'Pearl Bloom artificial earrings' }],
  },
  twitter: { card: 'summary_large_image', title: 'Shop All Earrings | Pearl Bloom', description: 'Affordable anti-tarnish earrings for women.', images: ['/earring.png'] },
}

export default async function Products() {
  // server-side fetch of all catalog products (fast local JSON)
  const allProducts: Product[] = await attachRatings(await getAllProducts())
  allProducts.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // derive categories for filters (unique)
  const categories = Array.from(
    new Set((allProducts.flatMap((p) => p.categories ?? []) as string[]))
  )

  return (
    <main className="container py-8 md:py-12">

      <section className="mt-6 md:mt-10">
        {/* The client-side browser will receive `allProducts` and categories */}
        {/* It handles filtering, sorting, search and pagination on the client for instant UX */}
        <CollectionBrowser initialProducts={allProducts} categories={categories} />
      </section>
    </main>
  )
}
