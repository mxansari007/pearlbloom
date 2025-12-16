// src/app/collections/page.tsx
import type { Metadata } from 'next'
import { getAllProducts } from '../../libs/products.server'
import CollectionHero from '../../components/CollectionHero'
import CollectionBrowser from '../../components/CollectionBrowser'
import type { Product } from '../../types/products'

export const metadata: Metadata = {
  title: 'Collections — Aurum',
  description: 'Explore Aurum’s curated collections: rings, necklaces, earrings and more. Handcrafted, ethically sourced, heirloom quality.'
}

export default async function CollectionsPage() {
  // server-side fetch of all catalog products (fast local JSON)
  const allProducts: Product[] = await getAllProducts()

  // derive categories for filters (unique)
  const categories = Array.from(
    new Set((allProducts.flatMap((p) => p.categories ?? []) as string[]))
  )

  return (
    <main className="container py-12">

      <section className="mt-10">
        {/* The client-side browser will receive `allProducts` and categories */}
        {/* It handles filtering, sorting, search and pagination on the client for instant UX */}
        <CollectionBrowser initialProducts={allProducts} categories={categories} />
      </section>
    </main>
  )
}
