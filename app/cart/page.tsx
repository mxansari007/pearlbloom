"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useAppConfigStore, useAuthStore } from "@/store/useAppStore";
import { useCouponStore } from "@/store/useCouponStore";
import { Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { track } from "@/utils/analytics";
import CouponPanel from "@/components/CouponPanel";

/* Brand palette (cream + maroon + gold) — matches CartDrawer's FinSet look */
const WINE = "#5e1830";
const WINE_TEXT = "#3d0f1a";
const WINE_LINE = "rgba(94,24,48,0.12)";
const WINE_MUTED = "rgba(61,15,26,0.62)";
const BLUSH = "#f6e6e1";

export default function CartPage() {
  const router = useRouter();

  const { items, removeItem, updateQty, clear } = useCartStore();
  const { user, isAuthenticated, authInitialized } = useAuthStore();
  const configLoaded = useAppConfigStore((s) => s.configLoaded);
  const globalShippingRate = useAppConfigStore((s) => s.shippingRate);
  const freeShippingAbove = useAppConfigStore((s) => s.freeShippingAbove);
  const { appliedCode, status: couponStatus, discountAmount, revalidate } = useCouponStore();

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
  const discount = couponStatus === "applied" ? discountAmount : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  useEffect(() => {
    if (!appliedCode) return;
    if (items.length === 0) return;
    if (!configLoaded) return;
    revalidate({
      items: items.map((i) => ({ productId: i.productId || i.id, price: i.price, quantity: i.quantity })),
      subtotal,
      userId: user?.uid ?? null,
    });
  }, [appliedCode, configLoaded, items, revalidate, subtotal, user?.uid]);

  const handleCheckout = () => {
    track("begin_checkout", {
      source: "cart_page",
      cart_item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      cart_unique_items: items.length,
      cart_value: subtotal,
      shipping,
      discount,
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
      style={{
        background: "linear-gradient(180deg, #fdf8f6 0%, #f6e6e1 100%)",
        color: WINE_TEXT,
      }}
    >
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <h1 className="text-3xl font-display" style={{ color: WINE }}>
              Shopping Cart
            </h1>
            {items.length > 0 && (
              <button
                onClick={clear}
                className="text-xs transition flex items-center gap-1 px-3 py-1 rounded-full hover:opacity-70"
                style={{
                  color: "#b1465a",
                  background: "#ffffff",
                  border: `1px solid ${WINE_LINE}`,
                }}
              >
                <Trash2 size={12} />
                Clear Cart
              </button>
            )}
          </div>
          <Link
            href="/"
            className="text-sm font-medium transition hover:opacity-70"
            style={{ color: WINE }}
          >
            Continue Shopping →
          </Link>
        </div>

        {/* Empty */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: BLUSH, color: WINE }}
            >
              <ShoppingBag size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium mb-3" style={{ color: WINE }}>
              Your cart is empty
            </h3>
            <p className="mb-8 max-w-md mx-auto" style={{ color: WINE_MUTED }}>
              Looks like you haven&apos;t added any items to your cart yet.
              Explore our collections to find your perfect piece.
            </p>
            <Link
              href="/earrings"
              className="inline-block rounded-full
                         bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500
                         px-8 py-3 text-black font-semibold
                         hover:brightness-110 transition-all"
              style={{ boxShadow: "0 14px 30px -14px rgba(180,140,40,0.7)" }}
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
                    background: "#ffffff",
                    border: `1px solid ${WINE_LINE}`,
                    boxShadow: "0 10px 30px -22px rgba(44,10,20,0.5)",
                  }}
                >
                  <div
                    className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0"
                    style={{ background: BLUSH }}
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
                      <p className="font-medium text-lg" style={{ color: WINE_TEXT }}>
                        {item.name}
                      </p>
                      {item.variantLabel && (
                        <p className="text-sm mt-1 font-medium" style={{ color: "#9a7b1f" }}>
                          {item.variantLabel}
                        </p>
                      )}
                      <p className="text-sm mt-2 font-semibold" style={{ color: WINE }}>
                        ₹{item.price.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity Controls — pill */}
                      <div
                        className="flex items-center gap-3 rounded-full px-3 py-1.5"
                        style={{ background: BLUSH, border: `1px solid ${WINE_LINE}` }}
                      >
                        <button
                          onClick={() => {
                            if (item.quantity > 1) updateQty(item.id, item.quantity - 1);
                            else removeItem(item.id);
                          }}
                          className="transition hover:opacity-60 p-1"
                          style={{ color: WINE }}
                        >
                          <Minus size={14} />
                        </button>
                        <span
                          className="text-sm w-6 text-center font-semibold"
                          style={{ color: WINE_TEXT }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="transition hover:opacity-60 p-1"
                          style={{ color: WINE }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm transition flex items-center gap-1 hover:opacity-60"
                        style={{ color: WINE_MUTED }}
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
                background: "#ffffff",
                border: `1px solid ${WINE_LINE}`,
                boxShadow: "0 20px 50px -30px rgba(44,10,20,0.45)",
              }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: WINE }}>
                Order Summary
              </h2>

              <div className="flex justify-between text-sm mb-3">
                <span style={{ color: WINE_MUTED }}>Subtotal</span>
                <span style={{ color: WINE_TEXT }}>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-sm mb-6">
                <span style={{ color: WINE_MUTED }}>Shipping</span>
                {!configLoaded ? (
                  <span style={{ color: WINE_MUTED }}>—</span>
                ) : eligibleForFreeShipping ? (
                  <span className="font-semibold" style={{ color: "#9a7b1f" }}>Free</span>
                ) : (
                  <span style={{ color: WINE_TEXT }}>₹{shipping.toLocaleString("en-IN")}</span>
                )}
              </div>

              {discount > 0 ? (
                <div className="flex justify-between text-sm mb-6">
                  <span style={{ color: WINE_MUTED }}>Discount</span>
                  <span className="font-semibold" style={{ color: "#9a7b1f" }}>
                    -₹{discount.toLocaleString("en-IN")}
                  </span>
                </div>
              ) : null}

              {configLoaded &&
                typeof freeShippingAbove === "number" &&
                freeShippingAbove > 0 &&
                shippingBase > 0 &&
                !eligibleForFreeShipping && (
                <div
                  className="text-xs mb-4 rounded-xl px-3 py-2"
                  style={{
                    background: BLUSH,
                    border: `1px solid ${WINE_LINE}`,
                    color: WINE,
                  }}
                >
                  Add ₹{Math.max(0, freeShippingAbove - subtotal).toLocaleString("en-IN")} more to unlock free shipping.
                </div>
              )}

              <div
                className="flex justify-between font-semibold text-lg mb-6 pt-4"
                style={{ borderTop: `1px solid ${WINE_LINE}` }}
              >
                <span style={{ color: WINE_TEXT }}>Total</span>
                <span style={{ color: WINE }}>₹{total.toLocaleString("en-IN")}</span>
              </div>

              <div className="mt-6">
                <CouponPanel
                  title="Have a coupon?"
                  items={items.map((i) => ({ productId: i.productId || i.id, price: i.price, quantity: i.quantity }))}
                  subtotal={subtotal}
                  userId={user?.uid ?? null}
                />
              </div>

              <button
                onClick={handleCheckout}
                className="w-full rounded-full
                           bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500
                           mt-4 py-3.5 text-black font-semibold
                           hover:brightness-110 transition"
                style={{ boxShadow: "0 14px 30px -14px rgba(180,140,40,0.7)" }}
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
