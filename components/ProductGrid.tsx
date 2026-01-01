import type { Product } from '../types/products'
import ProductCard from './ProductCard'

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <section className="py-2">
      <div className="container">
        <div className="-mx-5 sm:mx-0 bg-[var(--grid-divider)] p-px sm:bg-transparent sm:p-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px sm:gap-4 md:gap-6">
            {products.map((p) => (
              <ProductCard product={p} key={p.id} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
