// src/app/products/[slug]/layout.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "../../types/products";
import { getProductBySlug } from "../../libs/products.server";

type ParamsLike = { slug?: string } | Promise<{ slug?: string }>;

/* ---------------------------------------------------------------- */
/* Skeleton */
/* ---------------------------------------------------------------- */

function ProductLayoutSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="container py-8 space-y-6 animate-pulse">
      {/* Breadcrumbs */}
      <nav className="flex gap-2 text-xs">
        <div className="h-3 w-12 bg-white/10 rounded" />
        <span>/</span>
        <div className="h-3 w-20 bg-white/10 rounded" />
        <span>/</span>
        <div className="h-3 w-32 bg-white/10 rounded" />
      </nav>

      {/* Header */}
      <header className="space-y-2">
        <div className="h-8 w-2/3 bg-white/10 rounded" />
        <div className="h-4 w-32 bg-white/10 rounded" />
      </header>

      {/* Main shell */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] items-start">
        <div>{children}</div>

        <aside className="rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-5">
          <div className="h-3 w-12 bg-white/10 rounded mb-3" />
          <div className="h-6 w-24 bg-white/10 rounded" />
        </aside>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Async layout body (streams) */
/* ---------------------------------------------------------------- */

async function ProductLayoutStream({
  children,
  params,
}: {
  children: ReactNode;
  params: ParamsLike;
}) {
  const { slug } = (await params) as { slug?: string };

  if (!slug) {
    return (
      <div className="container py-8">
        <main>{children}</main>
      </div>
    );
  }

  const product: Product | null = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="container py-8 space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-xs md:text-sm text-muted flex gap-1 md:gap-2">
        <Link href="/" className="hover:text-white/80">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-white/80">
          Catalogue
        </Link>
        <span>/</span>
        <span className="text-white/80 truncate max-w-[12rem] md:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-display leading-tight">
          {product.name}
        </h1>
        {product.brand && (
          <p className="text-sm text-muted">by {product.brand}</p>
        )}
      </header>

      {/* Shell */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] items-start">
        <div>{children}</div>

        <aside className="rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-4 md:px-5 md:py-5 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-muted">
              Price
            </span>
            {product.price ? (
              <span className="text-lg font-semibold">
                ₹{product.price.toLocaleString()}
              </span>
            ) : (
              <span className="text-sm text-muted">On request</span>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Exported layout */
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
      <ProductLayoutStream params={params}>{children}</ProductLayoutStream>
    </Suspense>
  );
}
