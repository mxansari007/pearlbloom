import { notFound } from "next/navigation";
import { Suspense } from "react";
import InfiniteProductGrid from "@/components/InfiniteProductGrid";
import { getCollectionBySlug } from "@/libs/collections.server";
import { getProductsByCollectionId } from "@/libs/products.server";

/* ---------------- Skeleton ---------------- */

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-[420px] rounded-2xl bg-neutral-900/60 animate-pulse"
        />
      ))}
    </div>
  );
}

/* ---------------- Streaming Part ---------------- */

async function ProductGridStream({
  collectionSlug,
}: {
  collectionSlug: string;
}) {
  // ⛔ This must suspend (no caching)
  const data = await getProductsByCollectionId(collectionSlug);

  return (
    <InfiniteProductGrid
      initialProducts={data.products}
      initialCursor={data.nextCursor}
      collectionSlug={collectionSlug}
    />
  );
}

/* ---------------- Page ---------------- */

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();

  // ✅ Fast metadata fetch (OK to await here)
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  return (
    <section className="max-w-7xl mx-auto px-6 py-14">
      {/* Shell renders immediately */}
      <div className="mb-10">
        <h1 className="text-xl font-display tracking-wide">
          {collection.name}
        </h1>
        <p className="mt-2 text-sm text-neutral-400 max-w-xl">
          Handcrafted pieces designed to elevate everyday elegance.
        </p>
      </div>

      {/* ✅ REAL STREAMING */}
      <Suspense fallback={<GridSkeleton />}>
        <ProductGridStream collectionSlug={collection.slug} />
      </Suspense>
    </section>
  );
}
