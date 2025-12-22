import { Suspense } from "react";
import ProductGridClient from './ProductGridClient';


/* -------------------------------- Skeleton -------------------------------- */

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

/* ----------------------------- Server Fetch ----------------------------- */

async function fetchProducts(collectionSlug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/collections/${collectionSlug}/products`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error("Failed to fetch products");

  return res.json();
}

/* ----------------------------- Client Grid ----------------------------- */



/* -------------------------- Streaming Wrapper -------------------------- */

async function ProductGridStream({
  collectionSlug,
}: {
  collectionSlug: string;
}) {
  const data = await fetchProducts(collectionSlug);

  return (
    <ProductGridClient
      initialProducts={data.products}
      initialCursor={data.nextCursor}
      collectionSlug={collectionSlug}
    />
  );
}

/* ------------------------------- Export ------------------------------- */

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
