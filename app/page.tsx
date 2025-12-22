export const revalidate = 300;

import { Suspense } from "react";

import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import CollectionCard from "../components/CollectionCard";
import SubscribeForm from "../components/SubscriptionForm";

import { getHomepageSections } from "../libs/homepage.server";
import { getProductsByIds } from "../libs/products.server";
import { getCollectionsByIds } from "../libs/collections.server";

import type { Product } from "../types/products";

/* ---------------------------------------------------------------- */
/* Skeletons */
/* ---------------------------------------------------------------- */

function SectionSkeleton({ title }: { title?: string }) {
  return (
    <section className="container mx-auto px-6 py-14 animate-pulse">
      {title && (
        <div className="h-8 w-64 bg-white/10 rounded mb-6" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-neutral-900/60 border border-white/5 p-4"
          >
            <div className="aspect-[3/4] rounded-xl bg-white/10" />
            <div className="mt-4 h-4 w-3/4 bg-white/10 rounded" />
            <div className="mt-2 h-4 w-1/2 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

function CollectionsSkeleton({ title }: { title?: string }) {
  return (
    <section className="container mx-auto px-6 py-14 animate-pulse">
      {title && (
        <div className="h-7 w-56 bg-white/10 rounded mb-6" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-56 rounded-xl bg-white/10"
          />
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Streamed Sections */
/* ---------------------------------------------------------------- */

async function FeaturedProductsSection({
  section,
}: {
  section: any;
}) {
  const products: Product[] = await getProductsByIds(
    section.productIds ?? []
  );

  if (!products.length) return null;

  return (
    <section className="container mx-auto px-6 py-14">
      <h2 className="text-3xl font-display mb-6">
        {section.title}
      </h2>

      <ProductGrid products={products} />
    </section>
  );
}

async function CollectionsRowSection({
  section,
}: {
  section: any;
}) {
  if (!section.collectionIds?.length) return null;

  const collections = await getCollectionsByIds(
    section.collectionIds
  );

  if (!collections.length) return null;

  return (
    <section className="container mx-auto px-6 py-14">
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

/* ---------------------------------------------------------------- */
/* Page */
/* ---------------------------------------------------------------- */

export default async function Home() {
  const sections = await getHomepageSections();

  return (
    <>
      {/* Hero streams immediately */}
      <Hero />

      {/* Stream each section independently */}
      {sections.map((section: any) => {
        if (section.type === "featuredProducts") {
          return (
            <Suspense
              key={section.id}
              fallback={<SectionSkeleton title={section.title} />}
            >
              <FeaturedProductsSection section={section} />
            </Suspense>
          );
        }

        if (section.type === "collectionsRow") {
          return (
            <Suspense
              key={section.id}
              fallback={<CollectionsSkeleton title={section.title} />}
            >
              <CollectionsRowSection section={section} />
            </Suspense>
          );
        }

        if (section.type === "banner") {
          return (
            <section
              key={section.id}
              className="container mx-auto px-6 py-14"
            >
              <h2 className="text-2xl font-display">
                {section.title}
              </h2>
            </section>
          );
        }

        return null;
      })}

      {/* Footer subscription */}
      <section className="container mx-auto px-6 pb-14">
        <SubscribeForm />
      </section>
    </>
  );
}
