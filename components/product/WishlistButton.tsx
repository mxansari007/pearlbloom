"use client";

import { Heart } from "lucide-react";
import type { Product, Variant } from "../../types/products";
import { useWishlistStore } from "@/store/useWishlistStore";
import { getProductPriceInfo, getStartingVariantPriceInfo, getVariantPriceInfo } from "../../libs/pricing";
import { track } from "@/utils/analytics";

/**
 * Compact wishlist heart, placed beside the primary CTA (not buried under "Save").
 */
export default function WishlistButton({
  product,
  selectedVariant,
  className = "",
}: {
  product: Product;
  selectedVariant?: Variant;
  className?: string;
}) {
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.items.some((i) => i.id === product.id));

  function onToggle() {
    const price = selectedVariant
      ? getVariantPriceInfo(selectedVariant, product.inventory?.discountPercent).final
      : getStartingVariantPriceInfo(product)?.final ?? getProductPriceInfo(product).final ?? 0;

    toggle({
      id: product.id,
      name: product.name,
      price,
      image: selectedVariant?.images?.[0] ?? product.thumbnailUrl ?? product.images?.[0],
      slug: product.slug,
    });

    track(isWishlisted ? "wishlist_item_removed" : "wishlist_item_added", {
      product_id: product.id,
      slug: product.slug,
      price,
      source: "product_cta",
    });
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isWishlisted}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={isWishlisted ? "Saved to wishlist" : "Save to wishlist"}
      className={`wishlist-cta inline-flex items-center justify-center rounded-xl shrink-0 self-stretch ${className}`}
      style={{
        width: 54,
        minHeight: 54,
        border: "1px solid var(--card-border)",
        background: isWishlisted ? "rgba(var(--gold-rgb),0.12)" : "var(--card-bg-soft)",
        color: isWishlisted ? "rgb(var(--gold-rgb))" : "var(--fg)",
      }}
    >
      <Heart size={22} fill={isWishlisted ? "currentColor" : "none"} />
    </button>
  );
}
