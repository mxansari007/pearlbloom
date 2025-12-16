// src/components/RelatedProducts.tsx
import { getAllProducts } from '../libs/products.server'
import ProductCard from './ProductCard'
import type { Product } from '../types/products'

export default async function RelatedProducts({ currentSlug }: { currentSlug: string }) {
  const products: Product[] = await getAllProducts()
  // pick up to 4 items excluding the current product
  const suggestions = products.filter((p) => p.slug !== currentSlug).slice(0, 4)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {suggestions.map((p) => (
        // ProductCard should already be in your project
        <ProductCard product={p} key={p.id} />
      ))}
    </div>
  )
}
