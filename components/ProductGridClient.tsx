"use client";

import { useState } from "react";
import { Product } from "@/types/products";
import ProductCard from "./ProductCard";

/* ---------------- Skeleton ---------------- */

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-neutral-900/60 border border-white/5 p-4 animate-pulse">
      <div className="aspect-[3/4] rounded-xl bg-white/10" />
      <div className="mt-4 h-4 w-3/4 bg-white/10 rounded" />
      <div className="mt-2 h-4 w-1/2 bg-white/10 rounded" />
      <div className="mt-4 flex gap-3">
        <div className="h-9 w-20 bg-white/10 rounded" />
        <div className="ml-auto h-9 w-24 bg-white/10 rounded" />
      </div>
    </div>
  );
}

/* ---------------- Component ---------------- */

function ProductGridClient({
  initialProducts,
  initialCursor,
  collectionSlug,
}: {
  initialProducts:Product[];
  initialCursor: string | null;
  collectionSlug: string;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor || loading) return;

    setLoading(true);

    const res = await fetch(
      `/api/collections/${collectionSlug}/products?cursor=${cursor}`
    );

    const data = await res.json();

    setProducts((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const unique = data.products.filter(
        (p: Product) => !ids.has(p.id)
      );
      return [...prev, ...unique];
    });

    setCursor(data.nextCursor ?? null);
    setLoading(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}

        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={`loading-${i}`} />
          ))}
      </div>

      {cursor && (
        <div className="mt-12 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg bg-yellow-500 text-black px-6 py-2"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}

export default ProductGridClient;
