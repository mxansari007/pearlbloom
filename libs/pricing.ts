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
  // Admin saves variant stock as a plain number; older/web shape is { track, quantity }.
  const s = variant.stock as unknown;
  if (typeof s === "number") return s <= 0;
  if (s && typeof s === "object") {
    const o = s as { track?: boolean; quantity?: number };
    return !!o.track && (o.quantity ?? 0) <= 0;
  }
  return false;
}

// Product-level stock: out only when a tracked simple product hits 0, or when
// every variant is out of stock.
export function isProductOutOfStock(product: Product): boolean {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length > 0) return variants.every((v) => isOutOfStock(v));

  const inv = product.inventory as { trackStock?: boolean; stock?: number } | undefined;
  const track = inv?.trackStock ?? product.inventoryPolicy?.trackStock ?? false;
  if (!track) return false;
  return (typeof inv?.stock === "number" ? inv.stock : 0) <= 0;
}

/**
 * Real stock level for a variant. Admin saves `stock` as a plain number
 * (treated as a tracked quantity); the older/web shape is { track, quantity }.
 * `quantity` is null when stock is genuinely not tracked.
 */
export type StockLevel = {
  tracked: boolean;
  quantity: number | null;
  lowStockThreshold: number | null;
};

export function getVariantStockLevel(variant: Variant): StockLevel {
  const s = variant.stock as unknown;
  if (typeof s === "number") {
    return { tracked: true, quantity: s, lowStockThreshold: null };
  }
  if (s && typeof s === "object") {
    const o = s as { track?: boolean; quantity?: number; lowStockThreshold?: number };
    return {
      tracked: !!o.track,
      quantity: typeof o.quantity === "number" ? o.quantity : null,
      lowStockThreshold:
        typeof o.lowStockThreshold === "number" ? o.lowStockThreshold : null,
    };
  }
  return { tracked: false, quantity: null, lowStockThreshold: null };
}

export function getProductStockLevel(product: Product): StockLevel {
  const inv = product.inventory as
    | { trackStock?: boolean; stock?: number; lowStockThreshold?: number }
    | undefined;
  const tracked = inv?.trackStock ?? product.inventoryPolicy?.trackStock ?? false;
  return {
    tracked,
    quantity: typeof inv?.stock === "number" ? inv.stock : null,
    lowStockThreshold:
      typeof inv?.lowStockThreshold === "number" ? inv.lowStockThreshold : null,
  };
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
