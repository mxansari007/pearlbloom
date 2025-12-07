// src/app/page.tsx (or wherever your Home is)
import Hero from '../components/Hero'
import ProductGrid from '../components/ProductGrid'
import CollectionCard from '../components/CollectionCard'
import { getAllProducts } from '../libs/products'
import SubscribeForm from '../components/SubscriptionForm' // <- add this import

export default async function Home() {
  const products = await getAllProducts()
  const featured = products.slice(0, 4)
  return (
    <>
      <Hero />

      {/* Featured pieces */}
      <ProductGrid products={featured} />

      {/* Collections */}
      <section id="collections" className="container mx-auto px-6 py-14">
        <h2 className="text-2xl font-display mb-6">Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CollectionCard title="Engagement" image="https://images.unsplash.com/photo-1529519195486-16945f0fb37f?q=80&w=687&auto=format&fit=crop" />
          <CollectionCard title="Necklaces" image="https://images.unsplash.com/photo-1721103418218-416182aca079?q=80&w=687&auto=format&fit=crop" />
          <CollectionCard title="Earrings" image="https://images.unsplash.com/photo-1589128777073-263566ae5e4d?q=80&w=687&auto=format&fit=crop" />
        </div>
      </section>

      {/* Email subscription — subtle, full-width container */}
      <section className="container mx-auto px-6 pb-14">
        <SubscribeForm />
      </section>
    </>
  )
}
