"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useAppConfigStore, useAuthStore } from "@/store/useAppStore";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { track } from "@/utils/analytics";

export default function CartPage() {
  const router = useRouter();

  const { items, removeItem, updateQty, clear } = useCartStore();
  const { isAuthenticated, authInitialized } = useAuthStore();
  const configLoaded = useAppConfigStore((s) => s.configLoaded);
  const globalShippingRate = useAppConfigStore((s) => s.shippingRate);
  const freeShippingAbove = useAppConfigStore((s) => s.freeShippingAbove);

  const subtotal = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  const eligibleForFreeShipping =
    typeof freeShippingAbove === "number" && freeShippingAbove > 0 && subtotal >= freeShippingAbove;

  const shippingBase = items.reduce(
    (sum, i) => {
      const rate =
        typeof i.shippingRate === "number" && i.shippingRate > 0 ? i.shippingRate : globalShippingRate;
      return sum + rate * i.quantity;
    },
    0
  );

  const shipping = configLoaded ? (eligibleForFreeShipping ? 0 : shippingBase) : 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    track("begin_checkout", {
      source: "cart_page",
      cart_item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      cart_unique_items: items.length,
      cart_value: subtotal,
      shipping,
      total,
    });
    // wait until auth state is known
    if (!authInitialized) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/cart");
      return;
    }

    // user is logged in → go to checkout
    router.push("/checkout");
  };

  useEffect(() => {
    track("cart_viewed", {
      cart_item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      cart_unique_items: items.length,
      cart_value: subtotal,
      shipping,
      total,
    });
  }, [items, shipping, subtotal, total]);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--panel-bg)", color: "var(--fg)" }}
    >
      {/* Glow */}
      <div className="glow-bg">
        <span className="glow-orb" />
        <span className="glow-orb" />
        <span className="glow-orb" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Shopping Cart</h1>
            {items.length > 0 && (
              <button
                onClick={clear}
                className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1 border border-red-400/20 px-3 py-1 rounded-full hover:bg-red-400/10"
              >
                <Trash2 size={12} />
                Clear Cart
              </button>
            )}
          </div>
          <Link
            href="/"
            className="text-sm transition"
            style={{ color: "rgb(212,175,55)" }}
          >
            Continue Shopping →
          </Link>
        </div>

        {/* Empty */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--input-bg)] flex items-center justify-center mb-6 text-muted">
              <ShoppingBag size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium mb-3">Your cart is empty</h3>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Looks like you haven&apos;t added any items to your cart yet.
              Explore our collections to find your perfect piece.
            </p>
            <Link
              href="/products"
              className="inline-block rounded-xl
                         bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500
                         px-8 py-3 text-black font-medium
                         hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {/* Items */}
            <div className="md:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl p-4"
                  style={{
                    background: "var(--panel-bg-soft)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    className="relative w-24 h-24 rounded-xl overflow-hidden"
                    style={{
                      background: "var(--panel-bg)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <Image
                      src={item.image || ""}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-lg">{item.name}</p>
                      {item.variantLabel && (
                        <p
                          className="text-sm mt-1"
                          style={{ color: "rgb(212,175,55)" }}
                        >
                          {item.variantLabel}
                        </p>
                      )}
                      <p
                        className="text-sm mt-2 font-medium"
                      >
                        ₹{item.price.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-[var(--input-bg)] rounded-lg px-3 py-1.5 border border-[var(--input-border)]">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) updateQty(item.id, item.quantity - 1);
                            else removeItem(item.id);
                          }}
                          className="text-muted hover:text-foreground transition p-1"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="text-muted hover:text-foreground transition p-1"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm transition flex items-center gap-1 hover:text-red-400"
                        style={{ color: "var(--muted)" }}
                      >
                        <Trash2 size={16} />
                        <span className="hidden md:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div
              className="rounded-2xl p-6 h-fit"
              style={{
                background: "var(--panel-bg-soft)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>

              <div className="flex justify-between text-sm mb-3">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-sm mb-6">
                <span>Shipping</span>
                {!configLoaded ? (
                  <span style={{ color: "var(--muted)" }}>—</span>
                ) : eligibleForFreeShipping ? (
                  <span style={{ color: "rgb(212,175,55)" }}>Free</span>
                ) : (
                  <span>₹{shipping.toLocaleString("en-IN")}</span>
                )}
              </div>

              {configLoaded &&
                typeof freeShippingAbove === "number" &&
                freeShippingAbove > 0 &&
                shippingBase > 0 &&
                !eligibleForFreeShipping && (
                <div
                  className="text-xs mb-4 rounded-xl px-3 py-2"
                  style={{
                    background: "rgba(var(--gold-rgb),0.10)",
                    border: "1px solid rgba(var(--gold-rgb),0.22)",
                    color: "rgb(var(--gold-rgb))",
                  }}
                >
                  Add ₹{Math.max(0, freeShippingAbove - subtotal).toLocaleString("en-IN")} more to unlock free shipping.
                </div>
              )}

              <div className="flex justify-between font-medium text-lg mb-6">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full rounded-xl
                           bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500
                           py-3 text-black font-medium
                           hover:brightness-110 transition"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
