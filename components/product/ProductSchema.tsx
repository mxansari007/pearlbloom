import type { Product } from "../../types/products";
import {
  getProductPriceInfo,
  getStartingVariantPriceInfo,
  isProductOutOfStock,
} from "../../libs/pricing";
import { getProductReviewSummary } from "../../libs/products.server";
import { productPath, productCategorySlug } from "../../libs/productUrl";
import { ALL_CATEGORIES } from "../../libs/earringCategories";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlbloom.in";

function cleanSku(product: Product): string {
  const fromAttr = product.attributes?.find((a) => a.key.toLowerCase() === "sku")?.value;
  const fromVariant = Array.isArray(product.variants)
    ? product.variants.find((v) => v.sku)?.sku
    : undefined;
  return (fromAttr || fromVariant || product.id).toString();
}

/**
 * Product + Offer + BreadcrumbList JSON-LD for the PDP.
 * AggregateRating is emitted ONLY when real reviews exist (gated).
 */
export default async function ProductSchema({ product }: { product: Product }) {
  const url = `${SITE}${productPath(product)}`;
  const images = product.images?.length ? product.images : [`${SITE}/earring.png`];
  const absImages = images.map((i) => (i.startsWith("http") ? i : `${SITE}${i}`));

  const price =
    getStartingVariantPriceInfo(product)?.final ?? getProductPriceInfo(product).final;
  const outOfStock = isProductOutOfStock(product);

  const nextYearEnd = new Date(new Date().getFullYear() + 1, 11, 31)
    .toISOString()
    .split("T")[0];

  const summary = await getProductReviewSummary(product.id);

  const categoryLabel =
    ALL_CATEGORIES.find((c) => c.slug === productCategorySlug(product))?.label ||
    "Earrings";

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.shortDescription || product.name,
    image: absImages,
    sku: cleanSku(product),
    category: categoryLabel,
    brand: { "@type": "Brand", name: product.brand || "Pearl Bloom" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: String(price),
      priceValidUntil: nextYearEnd,
      itemCondition: "https://schema.org/NewCondition",
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Pearl Bloom" },
    },
  };

  // Gate aggregateRating strictly on real review data.
  if (summary.count > 0) {
    productLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(summary.average),
      reviewCount: String(summary.count),
      bestRating: "5",
      worstRating: "1",
    };
  }

  const cat = ALL_CATEGORIES.find((c) => c.slug === productCategorySlug(product)) ?? null;
  const crumbs = [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "Earrings", item: `${SITE}/earrings` },
  ];
  if (cat) {
    crumbs.push({
      "@type": "ListItem",
      position: 3,
      name: cat.label,
      item: `${SITE}/earrings/${cat.type}/${cat.slug}`,
    });
  }
  crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: product.name, item: url });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([productLd, breadcrumbLd]) }}
    />
  );
}
