// src/components/RelatedProducts.tsx
import { Suspense } from "react";
import { getRandomProducts } from "../libs/products.server";
import ProductCard from "./ProductCard";

/* --------------------------- Skeleton --------------------------- */

function RelatedProductsSkeleton() {
  return (
    <div className="-mx-5 sm:mx-0 bg-[var(--grid-divider)] p-px sm:bg-transparent sm:p-0">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-px sm:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-neutral-900/60 border border-white/5 p-4 animate-pulse"
        >
          <div className="aspect-[3/4] rounded-xl bg-white/10" />
          <div className="mt-4 h-4 w-3/4 bg-white/10 rounded" />
          <div className="mt-2 h-4 w-1/2 bg-white/10 rounded" />
          <div className="mt-4 flex gap-3">
            <div className="h-9 w-20 bg-white/10 rounded" />
            <div className="ml-auto h-9 w-24 bg-white/10 rounded" />
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

/* --------------------------- Stream --------------------------- */

async function RelatedProductsStream({
  currentSlug,
}: {
  currentSlug: string;
}) {
  // Only fetches ~20 products max instead of ALL products
  const suggestions = await getRandomProducts(currentSlug, 4);

  if (!suggestions.length) return null;

  return (
    <div className="-mx-5 sm:mx-0 bg-[var(--grid-divider)] p-px sm:bg-transparent sm:p-0">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-px sm:gap-6">
        {suggestions.map((p) => (
          <ProductCard product={p} key={p.id} />
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Export --------------------------- */

export default function RelatedProducts({
  currentSlug,
}: {
  currentSlug: string;
}) {
  return (
    <Suspense fallback={<RelatedProductsSkeleton />}>
      <RelatedProductsStream currentSlug={currentSlug} />
    </Suspense>
  );
}
