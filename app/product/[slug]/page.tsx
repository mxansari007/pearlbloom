// src/app/products/[slug]/page.tsx
export const revalidate = 60;

import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Product } from "../../../types/products";
import {
  getProductBySlug,
  getAllSlugs,
} from "../../../libs/products.server";

import ProductGallery from "../../../components/ProductGallery";
import RelatedProducts from "../../../components/RelatedProducts";
import Reviews from "../../../components/Reviews";
import ProductActions from "../../../components/ProductActions";

// types
type ParamsLike = { slug?: string } | Promise<{ slug?: string }>;

/* ---------------- Static params ---------------- */

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

/* ---------------- Metadata ---------------- */

export async function generateMetadata({
  params: paramsArg,
}: {
  params: ParamsLike;
}) {
  const { slug } = (await paramsArg) as { slug?: string };

  if (!slug) return { title: "Product not found — Aurum" };

  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — Aurum" };

  const images =
    product.images && product.images.length
      ? product.images
      : ["/images/placeholder.png"];

  return {
    title: `${product.name} — Pearl Bloom`,
    description: product.description ?? "",
    openGraph: {
      title: product.name,
      description: product.description ?? "",
      images,
    },
  };
}

/* ---------------- Page ---------------- */

export default async function ProductPage({
  params,
}: {
  params: ParamsLike;
}) {
  const { slug } = (await params) as { slug?: string };
  if (!slug) notFound();

  const product: Product | null = await getProductBySlug(slug);
  if (!product) notFound();

  const images =
    product.images && product.images.length
      ? product.images
      : ["/images/placeholder.png"];

  // derive SKU from attributes (dynamic) with fallback to id
  const skuAttr =
    product.attributes?.find(
      (a) => a.key.toLowerCase() === "sku"
    ) ?? null;

  const sku = (skuAttr && skuAttr.value) || product.id;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description ?? "",
    sku,
    image: images,
    offers: product.marketplaces
      ? Object.entries(product.marketplaces).map(([k, url]) => ({
          "@type": "Offer",
          url,
          priceCurrency: "INR",
          price: product.price ?? "",
          seller: { name: k.charAt(0).toUpperCase() + k.slice(1) },
        }))
      : undefined,
  };

  return (
    <>
      {/* SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Gallery left */}
          <div>
            <ProductGallery images={images} alt={product.name} />
          </div>

          {/* Details right */}
          <div className="space-y-6">
            {/* Title + brand */}
            <div>
              <h1 className="text-2xl md:text-3xl font-display leading-tight">
                {product.name}
              </h1>
              {product.brand && (
                <div className="text-sm text-muted mt-1">
                  {product.brand}
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              {product.price ? (
                <div className="text-xl md:text-2xl font-semibold">
                  ₹{product.price.toLocaleString()}
                </div>
              ) : (
                <div className="text-base text-muted">
                  Price on request
                </div>
              )}
            </div>

            {/* Short description */}
            {product.description && (
              <p className="text-base text-muted max-w-xl">
                {product.description}
              </p>
            )}

            {/* Marketplace Buttons */}
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              {product.marketplaces?.amazon && (
                <a
                  href={product.marketplaces.amazon}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta inline-flex items-center gap-2"
                >
                  Buy on Amazon
                </a>
              )}
              {product.marketplaces?.flipkart && (
                <a
                  href={product.marketplaces.flipkart}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 border border-white/6 hover:bg-white/2 transition text-sm"
                >
                  Buy on Flipkart
                </a>
              )}
              {product.marketplaces?.meesho && (
                <a
                  href={product.marketplaces.meesho}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 border border-white/6 hover:bg-white/2 transition text-sm"
                >
                  Buy on Meesho
                </a>
              )}

              {!product.marketplaces && (
                <div className="text-sm text-muted">
                  Not listed on marketplaces yet — contact us for purchase
                  options.
                </div>
              )}
            </div>

            {/* Quick actions (client) */}
            <ProductActions product={product} />

            {/* Dynamic attributes */}
            {(() => {
              const attrs = product.attributes;
              if (!attrs || attrs.length === 0) return null;

              return (
                <div className="text-sm text-muted mt-4 space-y-1">
                  {attrs.map((attr) => (
                    <div key={attr.key}>
                      <strong>{attr.key}:</strong> {attr.value}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* SKU */}
            <div className="text-sm text-muted mt-2">
              <strong>SKU:</strong> {sku}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="my-12 border-t border-white/6" />

        {/* Reviews */}
        <section aria-labelledby="reviews-title" className="mb-12">
          <h2
            id="reviews-title"
            className="text-xl font-display mb-4"
          >
            Customer reviews
          </h2>
          <Reviews productId={product.id} />
        </section>

        {/* Related products (STREAMING) */}
        <section aria-labelledby="you-may-like" className="mb-12">
          <h2
            id="you-may-like"
            className="text-xl font-display mb-6"
          >
            You may also like
          </h2>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
            }
          >
            <RelatedProducts currentSlug={product.slug} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
