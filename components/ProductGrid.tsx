import type { Product } from '../types/products'
import ProductCard from './ProductCard'

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <section className="py-14">
      <div className="container">
        <h2 className="text-3xl font-display mb-6">Featured Pieces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      </div>
    </section>
  )
}
