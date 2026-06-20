import type { Product } from "@/types/products";

/**
 * The category segment used in a product's canonical URL.
 * Prefers the product's primary style, then finish, then occasion, and finally
 * a neutral "all" so every product always resolves to a valid path.
 */
export function productCategorySlug(
  p: Pick<Product, "style" | "finish" | "occasion">
): string {
  return p.style?.[0] || p.finish?.[0] || p.occasion?.[0] || "all";
}

/**
 * Canonical path for a product detail page: /earrings/<category>/<slug>.
 */
export function productPath(
  p: Pick<Product, "slug" | "style" | "finish" | "occasion">
): string {
  return `/earrings/${productCategorySlug(p)}/${p.slug}`;
}
