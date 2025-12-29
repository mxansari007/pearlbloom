// src/app/products/[slug]/layout.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "../../../types/products";
import { getProductBySlug } from "../../../libs/products.server";

type ParamsLike = { slug?: string } | Promise<{ slug?: string }>;

/* ---------------------------------------------------------------- */
/* Skeleton */
/* ---------------------------------------------------------------- */

function ProductLayoutSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="container py-8 space-y-6 animate-pulse">
      <div className="h-3 w-1/3 bg-white/10 rounded" />
      <div className="h-10 w-2/3 bg-white/10 rounded" />
      <div>{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Streamed Layout */
/* ---------------------------------------------------------------- */

async function ProductLayoutStream({
  children,
  params,
}: {
  children: ReactNode;
  params: ParamsLike;
}) {
  const { slug } = (await params) as { slug?: string };
  if (!slug) return <main>{children}</main>;

  const product: Product | null = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="container py-8 space-y-8">
      {/* Breadcrumbs */}
      <nav className="text-xs md:text-sm text-muted flex gap-2">
        <Link href="/" className="hover:text-[var(--fg)] transition-colors">Home</Link>
        <span className="opacity-50">/</span>
        <Link href="/products" className="hover:text-[var(--fg)] transition-colors">Catalogue</Link>
        <span className="opacity-50">/</span>
        <span className="text-[var(--fg)] truncate">
          {product.name}
        </span>
      </nav>

      {/* Header */}
      <header className="max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-display leading-tight">
          {product.name}
        </h1>
        {product.brand && (
          <p className="text-sm text-muted mt-1">
            by {product.brand}
          </p>
        )}
      </header>

      {/* Content */}
      <main className="max-w-6xl">
        {children}
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Export */
/* ---------------------------------------------------------------- */

export default function ProductLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: ParamsLike;
}) {
  return (
    <Suspense fallback={<ProductLayoutSkeleton>{children}</ProductLayoutSkeleton>}>
      <ProductLayoutStream params={params}>
        {children}
      </ProductLayoutStream>
    </Suspense>
  );
}
