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
import ProductClient from "../../../components/ProductClient";

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
  if (!slug) return { title: "Product not found — Pearl Bloom" };

  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — Pearl Bloom" };

  const images =
    product.images?.length
      ? product.images
      : ["/images/placeholder.svg"];

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
    product.images?.length
      ? product.images
      : ["/images/placeholder.svg"];

  const skuAttr =
    product.attributes?.find(
      (a) => a.key.toLowerCase() === "sku"
    ) ?? null;

  const sku = skuAttr?.value || product.id;

  return (
    <div className="product-page">
      {/* Main Product Section */}
      <section className="product-page__main">
        <div className="product-page__grid">
          {/* Gallery Column */}
          <div className="product-page__gallery">
            <ProductGallery images={images} alt={product.name} />
          </div>

          {/* Details Column */}
          <div className="product-page__details">
            <ProductClient product={product} />

            {/* Description */}
            {product.description && (
              <div className="product-page__description">
                <h3 className="product-page__section-title">Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {/* Attributes */}
            {product.attributes?.length ? (
              <div className="product-page__attributes">
                <h3 className="product-page__section-title">Specifications</h3>
                <dl className="product-page__specs">
                  {product.attributes.map((a) => (
                    <div key={a.key} className="product-page__spec-row">
                      <dt>{a.key}</dt>
                      <dd>{a.value}</dd>
                    </div>
                  ))}
                  <div className="product-page__spec-row">
                    <dt>SKU</dt>
                    <dd>{sku}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="product-page__attributes">
                <h3 className="product-page__section-title">Product Details</h3>
                <dl className="product-page__specs">
                  <div className="product-page__spec-row">
                    <dt>SKU</dt>
                    <dd>{sku}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="product-page__divider" />

      {/* Reviews Section */}
      <section className="product-page__reviews">
        <Reviews productId={product.id} />
      </section>

      {/* Related Products */}
      <section className="product-page__related">
        <h2 className="product-page__heading">You May Also Like</h2>
        <Suspense fallback={<div className="product-page__loading">Loading recommendations...</div>}>
          <RelatedProducts currentSlug={product.slug} />
        </Suspense>
      </section>
    </div>
  );
}
