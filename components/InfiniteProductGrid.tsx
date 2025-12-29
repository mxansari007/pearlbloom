"use client";

import { useState } from "react";
import { Product } from "@/types/products";
import ProductCard from "./ProductCard";

/* ---------------- Skeleton ---------------- */

function ProductCardSkeleton() {
  return (
    <div className="collection-skeleton-card">
      <div className="aspect-[3/4]" />
    </div>
  );
}

/* ---------------- Component ---------------- */

export default function InfiniteProductGrid({
  initialProducts,
  initialCursor,
  collectionSlug,
}: {
  initialProducts: Product[];
  initialCursor: string | null;
  collectionSlug: string;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor || loading) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/collections/${collectionSlug}/products?cursor=${cursor}`
      );

      if (!res.ok) throw new Error("Failed to load");

      const data = await res.json();

      setProducts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const unique = data.products.filter(
          (p: Product) => !ids.has(p.id)
        );
        return [...prev, ...unique];
      });

      setCursor(data.nextCursor ?? null);
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (products.length === 0 && !loading) {
    return null; // Parent handles empty state
  }

  return (
    <>
      <div className="collection-page__grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}

        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={`loading-${i}`} />
          ))}
      </div>

      {cursor && (
        <div className="collection-page__load-more">
          <button
            onClick={loadMore}
            disabled={loading}
            className="collection-page__load-btn"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                Load More Products
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
