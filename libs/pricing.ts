import type { Product, Variant } from "../types/products";

export function getFinalPrice(variant: Variant): number {
  const mv = variant as Variant & { discountPrice?: number; discountPercent?: number };
  const original = typeof variant.price === "number" ? variant.price : 0;

  if (typeof mv.discountPrice === "number" && Number.isFinite(mv.discountPrice)) {
    return Math.max(0, Math.round(mv.discountPrice));
  }

  if (typeof mv.discountPercent === "number" && Number.isFinite(mv.discountPercent)) {
    return Math.round(original * (1 - mv.discountPercent / 100));
  }

  if (!variant.discount) return original;

  if (variant.discount.type === "PERCENT") {
    return Math.round(original * (1 - variant.discount.value / 100));
  }

  return Math.max(0, original - variant.discount.value);
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

export type PriceInfo = {
  original: number;
  final: number;
  hasDiscount: boolean;
  discountPercent: number;
};

export function getVariantPriceInfo(
  variant: Variant,
  productDiscountPercent?: number
): PriceInfo {
  const mv = variant as Variant & { discountPrice?: number; discountPercent?: number };
  const original = typeof variant.price === "number" ? variant.price : 0;

  const final = (() => {
    if (typeof mv.discountPrice === "number" && Number.isFinite(mv.discountPrice)) {
      return Math.max(0, Math.round(mv.discountPrice));
    }
    if (typeof mv.discountPercent === "number" && Number.isFinite(mv.discountPercent)) {
      return Math.round(original * (1 - mv.discountPercent / 100));
    }
    if (variant.discount?.type === "PERCENT") {
      return Math.round(original * (1 - variant.discount.value / 100));
    }
    if (variant.discount?.type === "FLAT") {
      return Math.max(0, original - variant.discount.value);
    }
    if (typeof productDiscountPercent === "number" && productDiscountPercent > 0) {
      return Math.round(original * (1 - productDiscountPercent / 100));
    }
    return original;
  })();

  const hasDiscount = original > 0 && final < original;
  const discountPercent = (() => {
    if (!hasDiscount) return 0;
    if (typeof mv.discountPercent === "number" && Number.isFinite(mv.discountPercent)) return Math.round(mv.discountPercent);
    if (variant.discount?.type === "PERCENT") return Math.round(variant.discount.value);
    if (typeof productDiscountPercent === "number" && productDiscountPercent > 0) return Math.round(productDiscountPercent);
    return Math.round((1 - final / original) * 100);
  })();

  return { original, final, hasDiscount, discountPercent };
}

export function getProductPriceInfo(product: Product): PriceInfo {
  const mp = product as Product & { discountPrice?: number };
  const original = typeof mp.price === "number" ? mp.price : 0;
  const final = (() => {
    if (typeof mp.discountPrice === "number" && Number.isFinite(mp.discountPrice)) {
      return Math.max(0, Math.round(mp.discountPrice));
    }
    const p = product.inventory?.discountPercent;
    if (typeof p === "number" && p > 0) return Math.round(original * (1 - p / 100));
    return original;
  })();

  const hasDiscount = original > 0 && final < original;
  const discountPercent = (() => {
    if (!hasDiscount) return 0;
    const p = product.inventory?.discountPercent;
    if (typeof p === "number" && p > 0) return Math.round(p);
    return Math.round((1 - final / original) * 100);
  })();

  return { original, final, hasDiscount, discountPercent };
}

export function getStartingVariantPriceInfo(product: Product): PriceInfo | null {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const activeVariants = variants.filter((v) => v && (v as Variant).isActive !== false);
  if (!activeVariants.length) return null;

  const productDiscountPercent = product.inventory?.discountPercent;
  const infos = activeVariants
    .map((v) => getVariantPriceInfo(v, productDiscountPercent))
    .filter((i) => i.original > 0);

  if (!infos.length) return null;
  const minFinal = Math.min(...infos.map((i) => i.final));
  const chosen = infos.find((i) => i.final === minFinal) ?? infos[0];
  return chosen;
}
