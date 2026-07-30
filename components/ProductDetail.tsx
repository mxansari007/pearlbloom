import Link from "next/link";
import type { Product } from "../types/products";
import { getProductReviewSummary } from "../libs/products.server";
import { productCategorySlug } from "../libs/productUrl";
import { ALL_CATEGORIES } from "../libs/earringCategories";

import ProductGallery from "./ProductGallery";
import ProductAssuranceCards from "./product/ProductAssuranceCards";
import RelatedProducts from "./RelatedProducts";
import Reviews from "./Reviews";
import ProductClient from "./ProductClient";
import ProductSchema from "./product/ProductSchema";

/**
 * Full product detail view. Rendered at the canonical URL
 * /earrings/<category>/<slug>. Receives an already-fetched product so the
 * route can do its canonical/redirect check without a second read.
 */
export default async function ProductDetail({ product }: { product: Product }) {
  const summary = await getProductReviewSummary(product.id);

  const images =
    product.images?.length ? product.images : ["/images/placeholder.svg"];

  const skuAttr =
    product.attributes?.find((a) => a.key.toLowerCase() === "sku") ?? null;

  const variantSku = Array.isArray(product.variants)
    ? product.variants.find((v) => v.sku)?.sku
    : undefined;

  // Only show a clean, human-readable SKU — never the raw UUID.
  const sku = skuAttr?.value || variantSku || null;

  // Breadcrumb category (links back to the matching facet collection).
  const catSlug = productCategorySlug(product);
  const cat = ALL_CATEGORIES.find((c) => c.slug === catSlug) ?? null;

  return (
    <div className="container py-6 space-y-6">
      {/* Breadcrumbs */}
      <nav
        className="text-xs md:text-sm text-muted flex gap-2 flex-wrap"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-[var(--fg)] transition-colors">
          Home
        </Link>
        <span className="opacity-50">/</span>
        <Link href="/earrings" className="hover:text-[var(--fg)] transition-colors">
          Earrings
        </Link>
        {cat && (
          <>
            <span className="opacity-50">/</span>
            <Link
              href={`/earrings/${cat.type}/${cat.slug}`}
              className="hover:text-[var(--fg)] transition-colors"
            >
              {cat.label}
            </Link>
          </>
        )}
        <span className="opacity-50">/</span>
        <span className="text-[var(--fg)] truncate">{product.name}</span>
      </nav>

      <div className="max-w-7xl mx-auto">
        <div className="product-page">
          <ProductSchema product={product} />

          {/* Top utility bar */}
          <div className="pdp-utilitybar">
            <span className="pdp-utilitybar__brand">
              PEARLBLOOM OFFICIAL
              {sku && (
                <>
                  <span className="pdp-utilitybar__dot" aria-hidden>
                    •
                  </span>
                  <span className="pdp-utilitybar__sku">SKU: {sku}</span>
                </>
              )}
            </span>
            <span className="pdp-utilitybar__assurance">
              🔒 Secure Checkout · Tracked Shipping
            </span>
          </div>

          {/* Main Product Section */}
          <section className="product-page__main">
            <div className="product-page__grid">
              {/* Gallery Column */}
              <div className="product-page__gallery">
                <ProductGallery
                  images={images}
                  alt={product.name}
                  imageAlt={product.imageAlt}
                  youtubeVideoUrl={product.youtubeVideoUrl}
                  videoThumbnailImage={product.videoThumbnailImage}
                  videoThumbnailAltText={product.videoThumbnailAltText}
                />
                <ProductAssuranceCards cards={product.assuranceCards} />
              </div>

              {/* Details Column — the redesigned buy-box */}
              <div className="product-page__details">
                <ProductClient
                  key={product.id}
                  product={product}
                  reviewAverage={summary.average}
                  reviewCount={summary.count}
                  sku={sku}
                />
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="product-page__divider" />

          {/* Reviews Section */}
          <section id="reviews" className="product-page__reviews">
            <Reviews productId={product.id} />
          </section>

          {/* Related Products */}
          <section className="product-page__related">
            <h2 className="product-page__heading">You May Also Like</h2>
            <RelatedProducts currentSlug={product.slug} />
          </section>
        </div>
      </div>
    </div>
  );
}
