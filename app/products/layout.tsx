// src/app/products/[slug]/layout.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Product } from "../../types/products";
import { getProductBySlug } from "../../libs/products";

type ParamsLike = { slug?: string } | Promise<{ slug?: string }>;

export default async function ProductLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: ParamsLike;
}) {
  // Always await params (handles Promise or plain object)
  const { slug } = (await params) as { slug?: string };

  // If slug is missing, don't hard 404; render a minimal shell
  if (!slug) {
    console.warn(
      "[ProductLayout] slug missing; rendering fallback layout until page resolves"
    );
    return (
      <div className="container py-8">
        <main>{children}</main>
      </div>
    );
  }

  const product: Product | null = await getProductBySlug(slug);
  if (!product) {
    console.log(
      "[ProductLayout] product not found for slug -> notFound():",
      slug
    );
    notFound();
  }

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
          {product.title}
        </span>
      </nav>

      {/* Page header */}
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-display leading-tight">
          {product.title}
        </h1>
        {product.brand && (
          <p className="text-sm text-muted">by {product.brand}</p>
        )}
      </header>

      {/* Shell layout: main content + simple aside */}
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
