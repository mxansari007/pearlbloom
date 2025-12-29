import { Variant } from "../types/products";

export function getFinalPrice(variant: Variant): number {
  if (!variant.discount) return variant.price;

  if (variant.discount.type === "PERCENT") {
    return Math.round(
      variant.price * (1 - variant.discount.value / 100)
    );
  }

  return Math.max(0, variant.price - variant.discount.value);
}

export function getStartingPrice(variants: Variant[]): number | null {
  if (!variants?.length) return null;

  return Math.min(
    ...variants.map((v) => getFinalPrice(v))
  );
}

export function isOutOfStock(variant: Variant): boolean {
  return variant.stock.track && variant.stock.quantity <= 0;
}
