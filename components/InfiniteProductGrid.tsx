"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types/products";
import ProductCard from "./ProductCard";

export default function InfiniteProductGrid({
  collectionSlug,
}: {
  collectionSlug: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // 🔒 prevents double initial fetch
  const hasLoadedOnce = useRef(false);

  /* ---------------- Reset when slug changes ---------------- */
  useEffect(() => {
    setProducts([]);
    setCursor(null);
    setDone(false);
    hasLoadedOnce.current = false; // ⬅️ reset guard
  }, [collectionSlug]);

  /* ---------------- Fetch function ---------------- */
  const loadMore = async () => {
    if (loading || done) return;

    setLoading(true);

    const res = await fetch(
      `/api/collections/${collectionSlug}/products${
        cursor ? `?cursor=${cursor}` : ""
      }`
    );

    const data = await res.json();

    setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNewProducts = data.products.filter(
            (p: any) => !existingIds.has(p.id)
        );

        return [...prev, ...uniqueNewProducts];
        });

    setCursor(data.nextCursor);
    setDone(!data.nextCursor);
    setLoading(false);
  };

  /* ---------------- Initial load (SAFE) ---------------- */
  useEffect(() => {
    if (hasLoadedOnce.current) return;

    hasLoadedOnce.current = true;
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionSlug]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {!done && (
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
