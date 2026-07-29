"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import { ShoppingBag, Trash2, Plus, Minus, X } from "lucide-react";
import { track } from "@/utils/analytics";
import { useAppConfigStore } from "@/store/useAppStore";

/* Theme-aware surface tokens (defined in globals.css). Light = cream + maroon;
   dark = deep plum + light rose, so the drawer adapts to the active theme. */
const WINE = "var(--drawer-accent)";
const WINE_TEXT = "var(--drawer-text)";
const WINE_LINE = "var(--drawer-line)";
const WINE_MUTED = "var(--drawer-muted)";
const BLUSH = "var(--drawer-pill)";
const CARD = "var(--drawer-card)";

export default function CartDrawer() {
  const { items, isOpen, close, removeItem, updateQty, clear } = useCartStore();
  const configLoaded = useAppConfigStore((s) => s.configLoaded);
  const freeShippingAbove = useAppConfigStore((s) => s.freeShippingAbove);

  /* ---------- lock body scroll when open ---------- */
  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add("no-scroll");
    } else {
      document.documentElement.classList.remove("no-scroll");
    }
    return () => document.documentElement.classList.remove("no-scroll");
  }, [isOpen]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div
      className={`fixed inset-0 z-50 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={close}
        className={`absolute inset-0 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: "rgba(44,10,20,0.45)", backdropFilter: "blur(2px)" }}
      />

      {/* Floating drawer (slides fully off, gap included) */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md p-3
                   transition-transform duration-300 ease-out"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(110%)" }}
      >
        <div
          className="flex flex-col h-full overflow-hidden rounded-[28px]"
          style={{
            background: "var(--drawer-bg)",
            border: `1px solid ${WINE_LINE}`,
            boxShadow: "0 30px 80px -30px rgba(44,10,20,0.55)",
            color: WINE_TEXT,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-display" style={{ color: WINE }}>
                Your Cart
              </h2>
              {items.length > 0 && (
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                  style={{
                    background: CARD,
                    color: WINE,
                    border: `1px solid ${WINE_LINE}`,
                  }}
                >
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {items.length > 0 && (
                <button
                  onClick={clear}
                  className="text-xs font-medium flex items-center gap-1 transition hover:opacity-70"
                  style={{ color: "#b1465a" }}
                >
                  <Trash2 size={13} />
                  Clear
                </button>
              )}
              <button
                onClick={close}
                aria-label="Close cart"
                className="grid place-items-center w-9 h-9 rounded-full transition hover:rotate-90"
                style={{
                  background: CARD,
                  color: WINE,
                  border: `1px solid ${WINE_LINE}`,
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3.5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: BLUSH, color: WINE }}
                >
                  <ShoppingBag size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: WINE }}>
                  Your cart is empty
                </h3>
                <p
                  className="text-sm mb-6 max-w-[220px]"
                  style={{ color: WINE_MUTED }}
                >
                  Looks like you haven&apos;t added any items to your cart yet.
                </p>
                <Link
                  href="/earrings"
                  onClick={close}
                  className="rounded-full px-7 py-3 text-sm font-semibold text-black
                             bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500
                             hover:brightness-110 transition"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl p-3"
                  style={{
                    background: CARD,
                    border: `1px solid ${WINE_LINE}`,
                    boxShadow: "0 10px 30px -22px rgba(44,10,20,0.5)",
                  }}
                >
                  <div
                    className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0"
                    style={{ background: BLUSH }}
                  >
                    <Image
                      src={item.image || ""}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <p
                          className="text-sm font-medium line-clamp-2"
                          style={{ color: WINE_TEXT }}
                        >
                          {item.name}
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="shrink-0 transition hover:opacity-60"
                          style={{ color: WINE_MUTED }}
                        >
                          <X size={15} />
                        </button>
                      </div>
                      {item.variantLabel && (
                        <p
                          className="text-xs mt-1 font-medium"
                          style={{ color: "#9a7b1f" }}
                        >
                          {item.variantLabel}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: WINE }}
                      >
                        ₹{item.price.toLocaleString("en-IN")}
                      </p>

                      {/* Quantity controls — pill */}
                      <div
                        className="flex items-center gap-3 rounded-full px-2.5 py-1"
                        style={{
                          background: BLUSH,
                          border: `1px solid ${WINE_LINE}`,
                        }}
                      >
                        <button
                          onClick={() => {
                            if (item.quantity > 1)
                              updateQty(item.id, item.quantity - 1);
                            else removeItem(item.id);
                          }}
                          aria-label="Decrease quantity"
                          className="transition hover:opacity-60 p-0.5"
                          style={{ color: WINE }}
                        >
                          <Minus size={12} />
                        </button>
                        <span
                          className="text-xs w-4 text-center font-semibold"
                          style={{ color: WINE_TEXT }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="transition hover:opacity-60 p-0.5"
                          style={{ color: WINE }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div
              className="px-6 pt-4 pb-6 mt-2"
              style={{ borderTop: `1px solid ${WINE_LINE}` }}
            >
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm" style={{ color: WINE_MUTED }}>
                  Total
                </span>
                <span
                  className="text-xl font-semibold"
                  style={{ color: WINE }}
                >
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              {configLoaded &&
                typeof freeShippingAbove === "number" &&
                freeShippingAbove > 0 && (
                  <div className="text-xs mb-4" style={{ color: WINE_MUTED }}>
                    {subtotal >= freeShippingAbove
                      ? "🎉 Free shipping unlocked on this order."
                      : `Add ₹${Math.max(
                          0,
                          freeShippingAbove - subtotal
                        ).toLocaleString("en-IN")} more for free shipping.`}
                  </div>
                )}

              <Link
                href="/cart"
                onClick={() => {
                  track("view_cart_clicked", {
                    source: "cart_drawer",
                    cart_item_count: itemCount,
                    cart_unique_items: items.length,
                    cart_value: subtotal,
                  });
                  close();
                }}
                className="block text-center rounded-full
                           bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500
                           py-3.5 text-black font-semibold
                           hover:brightness-110 transition"
                style={{ boxShadow: "0 14px 30px -14px rgba(180,140,40,0.7)" }}
              >
                View Cart
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
