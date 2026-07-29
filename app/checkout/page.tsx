"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useCartStore } from "@/store/useCartStore";
import { useAppConfigStore, useAuthStore } from "@/store/useAppStore";
import { useCouponStore } from "@/store/useCouponStore";
import type { Address } from "@/types/user";
import { placeOrder } from "@/utils/placeorder";
import { track } from "@/utils/analytics";
import CheckoutAddressSection from "@/components/CheckoutAddressSection";
import CouponPanel from "@/components/CouponPanel";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

function getRazorpayConstructor(): RazorpayConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { Razorpay?: RazorpayConstructor };
  return w.Razorpay ?? null;
}

export default function CheckoutPage() {
  const router = useRouter();

  const { items } = useCartStore();
  const { user, isAuthenticated, authInitialized } = useAuthStore();
  const configLoaded = useAppConfigStore((s) => s.configLoaded);
  const globalShippingRate = useAppConfigStore((s) => s.shippingRate);
  const freeShippingAbove = useAppConfigStore((s) => s.freeShippingAbove);
  const { appliedCode, status: couponStatus, discountAmount, eligibleSubtotal: couponEligibleSubtotal, coupon, revalidate } =
    useCouponStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

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

  useEffect(() => {
    if (items.length === 0) return;
    track("checkout_viewed", {
      source: "cart_checkout",
      cart_item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      cart_unique_items: items.length,
      cart_value: subtotal,
      shipping,
      discount,
      total,
    });
  }, [items, shipping, subtotal, discount, total]);

  /* ---------------- Auth Guard ---------------- */

  useEffect(() => {
    if (!authInitialized) return;

    if (!isAuthenticated) {
      router.replace("/login?redirect=/checkout");
      return;
    }

    if (items.length === 0 && !isOrderPlaced) {
      router.replace("/cart");
      return;
    }
  }, [authInitialized, isAuthenticated, items, isOrderPlaced, router]);

  if (!authInitialized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--panel-bg)", color: "var(--muted)" }}
      >
        Preparing checkout…
      </div>
    );
  }

//   handle place order function can be added here in future

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (getRazorpayConstructor()) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    document.body.appendChild(script);
  });


const handlePlaceOrder = async () => {
  if (!configLoaded || !user || !address || items.length === 0) return;

  try {
    setPlacingOrder(true);

    const now = Date.now();
    const couponPayload =
      couponStatus === "applied" && coupon
        ? {
            code: coupon.code,
            title: coupon.title,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            eligibleSubtotal: couponEligibleSubtotal,
            discountAmount: discount,
            scope: coupon.scope,
          }
        : null;

    if (total <= 0) {
      throw new Error("Order total must be greater than ₹0.");
    }

    track("checkout_submitted", {
      cart_item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      cart_unique_items: items.length,
      cart_value: subtotal,
      shipping,
      discount,
      total,
      ...(couponPayload?.code ? { coupon_code: couponPayload.code } : {}),
    });

    // 1️⃣ Create order in Firestore (pending)
    // Note: Firestore doesn't accept undefined values, so we use empty strings as fallbacks
    const orderId = await placeOrder({
      userId: user.uid,
      phone: user.phone || "",
      items: items.map((i) => ({
        productId: i.productId || i.id,
        variantId: i.variantId || i.id,
        name: i.name || "",
        variantLabel: i.variantLabel || "",
        price: i.price || 0,
        quantity: i.quantity || 1,
        image: i.image || "",                     // Firestore doesn't accept undefined
        sku: i.sku || "",                         // Firestore doesn't accept undefined
        slug: i.slug || "",
      })),
      subtotal,
      shipping,
      total,
      discount,
      coupon: couponPayload,
      address,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    track("order_created", {
      order_id: orderId,
      cart_item_count: items.reduce((sum, i) => sum + i.quantity, 0),
      cart_unique_items: items.length,
      cart_value: subtotal,
      shipping,
      discount,
      total,
      ...(couponPayload?.code ? { coupon_code: couponPayload.code } : {}),
    });

    // 2️⃣ Load Razorpay
    await loadRazorpay();

    // 3️⃣ Create Razorpay order (server)
    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: total,
        receipt: orderId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Razorpay order creation failed:", errorData);
      throw new Error(errorData.error || "Failed to create payment order");
    }

    const razorpayOrder = await res.json();

    if (!razorpayOrder.id) {
      console.error("Invalid Razorpay order response:", razorpayOrder);
      throw new Error("Invalid payment order response");
    }

    // 4️⃣ Open Razorpay Checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: "INR",
      name: "Pearl Bloom",
      description: "Order Payment",
      order_id: razorpayOrder.id,

      handler: async function (response: RazorpaySuccessResponse) {
        // 5️⃣ Update order → paid
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            ...response,
          }),
        });

        track("payment_succeeded", {
          order_id: orderId,
          verified: verifyRes.ok,
          cart_item_count: items.reduce((sum, i) => sum + i.quantity, 0),
          cart_unique_items: items.length,
          cart_value: subtotal,
          shipping,
          discount,
          total,
          ...(couponPayload?.code ? { coupon_code: couponPayload.code } : {}),
        });

        const date = new Date().toISOString().split("T")[0];
        const displayId = `PB-${date}-${orderId.slice(-6).toUpperCase()}`;

        router.push(`/order-success/${displayId}`);
      },

      prefill: {
        name: address.fullName,
        contact: address.phone,
      },

      theme: {
        color: "#d4af37",
      },

      modal: {
        ondismiss: () => {
             // Only redirect if NOT currently verifying a success response
             // See similar logic in buy-now/page.tsx
             if (!isOrderPlaced) {
                track("payment_cancelled", {
                  order_id: orderId,
                  cart_item_count: items.reduce((sum, i) => sum + i.quantity, 0),
                  cart_unique_items: items.length,
                  cart_value: subtotal,
                  shipping,
                  discount,
                  total,
                  ...(couponPayload?.code ? { coupon_code: couponPayload.code } : {}),
                });
                setIsOrderPlaced(true); // Prevent guard from redirecting to cart
                setTimeout(() => {
                    const clearCart = useCartStore.getState().clear;
                    clearCart();
                    
                    // Construct displayId manually
                    const date = new Date().toISOString().split("T")[0];
                    const displayId = `PB-${date}-${orderId.slice(-6).toUpperCase()}`;
                    router.replace(`/orders/${displayId}`);
                }, 200);
             }
        },
      },
    };

    const Razorpay = getRazorpayConstructor();
    if (!Razorpay) {
      throw new Error("Razorpay SDK failed to load");
    }

    const paymentObject = new Razorpay(options);
    
    // Handle explicit payment failures
    paymentObject.on("payment.failed", function (response: unknown) {
        console.error("Payment failed:", response);
        track("payment_failed", {
          order_id: orderId,
          cart_item_count: items.reduce((sum, i) => sum + i.quantity, 0),
          cart_unique_items: items.length,
          cart_value: subtotal,
          shipping,
          discount,
          total,
          ...(couponPayload?.code ? { coupon_code: couponPayload.code } : {}),
        });
        
        setIsOrderPlaced(true); // Prevent guard from redirecting to cart
        const clearCart = useCartStore.getState().clear;
        clearCart();
        
        const date = new Date().toISOString().split("T")[0];
        const displayId = `PB-${date}-${orderId.slice(-6).toUpperCase()}`;
        router.replace(`/orders/${displayId}`);
    });

    track("payment_started", {
      order_id: orderId,
      amount: total,
      currency: "INR",
      cart_value: subtotal,
      shipping,
      discount,
      ...(couponPayload?.code ? { coupon_code: couponPayload.code } : {}),
    });
    paymentObject.open();

  } catch (err) {
    console.error("❌ Payment error:", err);
    const message = err instanceof Error ? err.message : "Payment failed";
    alert(`${message}. Please try again.`);
  } finally {
    setPlacingOrder(false);
  }
};




  /* ---------------- UI ---------------- */

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-8 md:py-12"
      style={{ background: "var(--panel-bg)", color: "var(--fg)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Checkout</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Review your order and confirm delivery details
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">

          {/* DELIVERY ADDRESS */}
          <section
            className="rounded-2xl p-4 sm:p-6"
            style={{
              background: "var(--panel-bg-soft)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {user?.uid ? (
              <CheckoutAddressSection
                userId={user.uid}
                title="Delivery Address"
                selectedAddressId={selectedAddressId}
                onSelectAddressId={setSelectedAddressId}
                onSelectedAddress={setAddress}
              />
            ) : null}
          </section>

          {/* ORDER ITEMS */}
          <section
            className="rounded-2xl p-4 sm:p-6"
            style={{
              background: "var(--panel-bg-soft)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h2 className="text-lg font-medium mb-4">Order Items</h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4"
                >
                  <div
                    className="relative w-20 h-20 rounded-xl overflow-hidden"
                    style={{
                      background: "var(--panel-bg)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <Image
                      src={item.image || ""}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.variantLabel && (
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {item.variantLabel}
                      </p>
                    )}
                    <p
                      className="text-sm"
                      style={{ color: "var(--muted)" }}
                    >
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>

                  <div className="text-sm font-medium">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN – SUMMARY */}
        <div
          className="rounded-2xl p-6 h-fit"
          style={{
            background: "var(--panel-bg-soft)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h2 className="text-lg font-medium mb-4">Order Summary</h2>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              {!configLoaded ? (
                <span style={{ color: "var(--muted)" }}>—</span>
              ) : eligibleForFreeShipping ? (
                <span style={{ color: "rgb(212,175,55)" }}>Free</span>
              ) : (
                <span>₹{shipping.toLocaleString("en-IN")}</span>
              )}
            </div>

            {discount > 0 ? (
              <div className="flex justify-between">
                <span>Discount</span>
                <span style={{ color: "rgb(var(--gold-rgb))" }}>
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
                className="text-xs rounded-xl px-3 py-2"
                style={{
                  background: "rgba(var(--gold-rgb),0.10)",
                  border: "1px solid rgba(var(--gold-rgb),0.22)",
                  color: "rgb(var(--gold-rgb))",
                }}
              >
                Add ₹{Math.max(0, freeShippingAbove - subtotal).toLocaleString("en-IN")} more to unlock free shipping.
              </div>
            )}

            <div
              className="flex justify-between pt-3 mt-3 border-t text-lg"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span className="font-medium">Total</span>
              <span className="font-medium">₹{total.toLocaleString("en-IN")}</span>
            </div>
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
            onClick={handlePlaceOrder}
            disabled={!configLoaded || !address || placingOrder}
            className="w-full rounded-xl mt-4 py-3 font-medium transition"
            style={{
              background: !configLoaded || !address
                ? "rgba(0,0,0,0.2)"
                : "linear-gradient(to right, #fcd34d, #fbbf24)",
              color: !configLoaded || !address ? "var(--muted)" : "#000",
              cursor: !configLoaded || !address ? "not-allowed" : "pointer",
            }}
          >
            {placingOrder ? "Placing order…" : "Place Order"}
          </button>

          <div
            className="mt-4 rounded-xl p-5 text-sm"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle)",
              color: "var(--muted)",
            }}
          >
            <div className="flex items-center justify-between gap-x-3 gap-y-1 flex-wrap">
              <span className="font-medium" style={{ color: "var(--fg)" }}>Secure checkout</span>
              <span className="text-xs">Payments powered by Razorpay</span>
            </div>
            <div className="text-xs mt-3 leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span>UPI • Cards • Netbanking • Wallets</span>
              <span className="opacity-50">•</span>
              <a href="/returns-and-refunds" className="underline underline-offset-2">Returns &amp; refunds</a>
              <span className="opacity-50">•</span>
              <a href="/shipping-and-delivery" className="underline underline-offset-2">Shipping</a>
              <span className="opacity-50">•</span>
              <a href="/contact" className="underline underline-offset-2">Need help?</a>
            </div>
          </div>

          {!configLoaded ? (
            <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
              Loading shipping rates…
            </p>
          ) : !address ? (
            <p
              className="text-xs mt-3"
              style={{ color: "var(--muted)" }}
            >
              Please add a delivery address to continue.
            </p>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}
