// src/app/page.tsx
import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import CollectionCard from "../components/CollectionCard";
import SubscribeForm from "../components/SubscriptionForm";

import { getHomepageSections } from "../libs/homepage.server";
import { getProductsByIds } from "../libs/products.server";
import { getCollectionsByIds } from "../libs/collections.server";

import type { Product } from "../types/products";

export default async function Home() {
  const sections = await getHomepageSections();

  return (
    <>

      {/* Hero always on top */}
      <Hero />

      {/* Dynamic homepage sections */}
      {await Promise.all(
        sections.map(async (section: any) => {
          /* ---------------- Featured products ---------------- */
          if (section.type === "featuredProducts") {
            const products: Product[] = await getProductsByIds(
              section.productIds ?? []
            );

            if (products.length === 0) return null;

            return (
              <section
                key={section.id}
                className="container mx-auto px-6 py-14"
              >
                <h2 className="text-3xl font-display mb-6">
                  {section.title}
                </h2>

                <ProductGrid products={products} />
              </section>
            );
          }


          /* ---------------- Collections row ---------------- */
          if (section.type === "collectionsRow") {
            if (!section.collectionIds?.length) return null;

            const collections = await getCollectionsByIds(
              section.collectionIds
            );

            if (collections.length === 0) return null;

            return (
              <section
                key={section.id}
                className="container mx-auto px-6 py-14"
              >
                <h2 className="text-2xl font-display mb-6">
                  {section.title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {collections.map((c) => (
                    <CollectionCard
                      key={c.id}
                      title={c.name}
                      slug={c.slug}
                      thumbnail={c.thumbnail}
                    />
                  ))}
                </div>
              </section>
            );
          }

          /* ---------------- Banner ---------------- */
          if (section.type === "banner") {
            return (
              <section
                key={section.id}
                className="container mx-auto px-6 py-14"
              >
                <h2 className=" text-2xl font-display">
                  {section.title}
                </h2>
              </section>
            );
          }

          return null;
        })
      )}

      {/* Email subscription always last */}
      <section className="container mx-auto px-6 pb-14">
        <SubscribeForm />
      </section>
    </>
  );
}
