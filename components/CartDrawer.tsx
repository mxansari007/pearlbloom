"use client";

import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import { ShoppingBag, Trash2, Plus, Minus, X } from "lucide-react";
import { track } from "@/utils/analytics";
import { useAppConfigStore } from "@/store/useAppStore";

export default function CartDrawer() {
  const { items, isOpen, close, removeItem, updateQty, clear } = useCartStore();
  const configLoaded = useAppConfigStore((s) => s.configLoaded);
  const freeShippingAbove = useAppConfigStore((s) => s.freeShippingAbove);

  const total = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <div
      className={`fixed inset-0 z-50 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={close}
        className={`absolute inset-0 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "var(--overlay-bg)",
        }}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md
        transform transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "var(--panel-bg)",
          borderLeft: "1px solid var(--border-subtle)",
          color: "var(--fg)",
        }}
      >
        {/* 🔴 Glow Background */}
        <div className="glow-bg">
          <span className="glow-orb" />
          <span className="glow-orb" />
          <span className="glow-orb" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium">Your Cart</h2>
              {items.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--input-bg)] border border-[var(--input-border)] text-muted">
                  {items.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {items.length > 0 && (
                <button
                  onClick={clear}
                  className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              )}
              <button
                onClick={close}
                aria-label="Close cart"
                className="transition hover:rotate-90"
                style={{ color: "var(--muted)" }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 rounded-full bg-[var(--input-bg)] flex items-center justify-center mb-4 text-muted">
                  <ShoppingBag size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                <p className="text-sm text-muted mb-6 max-w-[200px]">
                  Looks like you haven&apos;t added any items to your cart yet.
                </p>
                <Link
                  href="/products"
                  onClick={close}
                  className="btn-cta text-sm px-6 py-2.5"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[var(--input-bg)]">
                    <Image
                      src={item.image || ""}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="text-muted hover:text-red-400 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {item.variantLabel && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: "rgb(212,175,55)" }}
                        >
                          {item.variantLabel}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm font-medium">
                        ₹{item.price.toLocaleString("en-IN")}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-[var(--input-bg)] rounded-lg px-2 py-1 border border-[var(--input-border)]">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) updateQty(item.id, item.quantity - 1);
                            else removeItem(item.id);
                          }}
                          className="text-muted hover:text-foreground transition p-0.5"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs w-4 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="text-muted hover:text-foreground transition p-0.5"
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
          <div
            className="px-6 py-4"
            style={{
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex justify-between mb-4">
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>

            {configLoaded && typeof freeShippingAbove === "number" && freeShippingAbove > 0 && (
              <div className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                {total >= freeShippingAbove
                  ? "Free shipping unlocked on this order."
                  : `Add ₹${Math.max(0, freeShippingAbove - total).toLocaleString("en-IN")} more for free shipping.`}
              </div>
            )}

            <Link
              href="/cart"
              onClick={() => {
                track("view_cart_clicked", {
                  source: "cart_drawer",
                  cart_item_count: items.reduce((sum, i) => sum + i.quantity, 0),
                  cart_unique_items: items.length,
                  cart_value: total,
                });
                close();
              }}
              className="block text-center rounded-xl
                         bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500
                         py-3 text-black font-medium
                         hover:brightness-110 transition"
            >
              View Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
