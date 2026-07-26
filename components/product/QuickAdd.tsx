"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import type { Product, Variant } from "../../types/products";
import { useCartStore, type CartItem } from "@/store/useCartStore";
import {
  getProductPriceInfo,
  getStartingVariantPriceInfo,
  getVariantPriceInfo,
  isOutOfStock,
  isProductOutOfStock,
} from "../../libs/pricing";
import { track } from "@/utils/analytics";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function QuickAdd({ product, className = "" }: { product: Product; className?: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const variants = (Array.isArray(product.variants) ? product.variants : []).filter(
    (v) => v.isActive !== false
  );
  const isMulti = variants.length > 1;
  const oos = isProductOutOfStock(product);
  const displayPrice = getStartingVariantPriceInfo(product)?.final ?? getProductPriceInfo(product).final;

  function buildItem(variant?: Variant): CartItem {
    if (variant) {
      const variantLabel = (variant.attributes ?? []).map((a) => a.value).join(" / ");
      return {
        id: variant.id,
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantLabel,
        price: getVariantPriceInfo(variant, product.inventory?.discountPercent).final,
        shippingRate: product.shippingRate,
        image: variant.images?.[0] ?? product.thumbnailUrl ?? product.images?.[0],
        quantity: 1,
        sku: variant.sku,
        slug: product.slug,
      };
    }
    return {
      id: product.id,
      productId: product.id,
      variantId: product.id,
      name: product.name,
      variantLabel: "",
      price: displayPrice,
      shippingRate: product.shippingRate,
      image: product.thumbnailUrl ?? product.images?.[0],
      quantity: 1,
      slug: product.slug,
    };
  }

  function add(variant?: Variant) {
    const item = buildItem(variant);
    track("quick_add_clicked", {
      product_id: product.id,
      variant_id: item.variantId,
      slug: product.slug,
      price: item.price,
      source: "product_card",
    });
    addItem(item);
    setOpen(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    openCart();
  }

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (oos) return;
    if (isMulti) setOpen((v) => !v);
    else add();
  }

  return (
    <div className={`relative z-20 ${className}`}>
      {/* Variant popover */}
      {open && isMulti && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 rounded-xl p-1.5 shadow-xl"
          style={{ background: "var(--panel, #fff)", border: "1px solid var(--card-border)" }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Choose an option
          </p>
          <div className="max-h-44 overflow-y-auto">
            {variants.map((v) => {
              const label = (v.attributes ?? []).map((a) => a.value).join(" / ") || "Option";
              const vOos = isOutOfStock(v);
              const price = getVariantPriceInfo(v, product.inventory?.discountPercent).final;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={vOos}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); add(v); }}
                  className="w-full flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors disabled:opacity-40 hover:bg-[var(--card-bg-soft)]"
                  style={{ color: "var(--fg)" }}
                >
                  <span className="truncate">{label}</span>
                  <span className="shrink-0 font-semibold">{vOos ? "Sold out" : inr(price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={oos}
        aria-label={oos ? "Sold out" : isMulti ? "Choose options" : `Quick add to cart for ${inr(displayPrice)}`}
        className="quick-add-btn w-full inline-flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all active:scale-95 disabled:opacity-60"
        style={{
          background: oos ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.95)",
          color: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
        }}
      >
        {added ? <Check size={16} /> : <Plus size={16} />}
        <span>
          {oos ? "Sold Out" : added ? "Added" : isMulti ? "Quick Add" : `Quick Add · ${inr(displayPrice)}`}
        </span>
      </button>
    </div>
  );
}
