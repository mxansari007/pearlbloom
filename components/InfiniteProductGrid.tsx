import { Suspense } from "react";
import ProductGridClient from "./ProductGridClient";
import { getCollectionBySlug } from "@/libs/collections.server";
import { getProductsByCollectionId } from "@/libs/products.server";

/* ---------------- Skeleton ---------------- */

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-white/5 p-4 animate-pulse">
      <div className="aspect-[3/4] rounded-xl bg-white/10" />
      <div className="mt-4 h-4 w-3/4 bg-white/10 rounded" />
      <div className="mt-2 h-4 w-1/3 bg-white/10 rounded" />
      <div className="mt-4 flex gap-3">
        <div className="h-9 w-20 bg-white/10 rounded" />
        <div className="ml-auto h-9 w-24 bg-white/10 rounded" />
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ---------------- Streaming Server Component ---------------- */

async function ProductGridStream({
  collectionSlug,
}: {
  collectionSlug: string;
}) {
  const collection = await getCollectionBySlug(collectionSlug);

  if (!collection) {
    return (
      <ProductGridClient
        initialProducts={[]}
        initialCursor={null}
        collectionSlug={collectionSlug}
      />
    );
  }

  const data = await getProductsByCollectionId(collection.id);

  return (
    <ProductGridClient
      initialProducts={data.products}
      initialCursor={data.nextCursor}
      collectionSlug={collectionSlug}
    />
  );
}

/* ---------------- Export ---------------- */

export default function InfiniteProductGrid({
  collectionSlug,
}: {
  collectionSlug: string;
}) {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <ProductGridStream collectionSlug={collectionSlug} />
    </Suspense>
  );
}
