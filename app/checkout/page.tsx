"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAppStore";
import { dbClient } from "@/libs/firebase-client";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Address } from "@/types/user";
import { placeOrder } from "@/utils/placeorder";

export default function CheckoutPage() {
  const router = useRouter();

  const { items } = useCartStore();
  const { user, isAuthenticated, authInitialized } = useAuthStore();

  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);

  const total = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  /* ---------------- Auth Guard ---------------- */

  useEffect(() => {
    if (!authInitialized) return;

    if (!isAuthenticated) {
      router.replace("/login?redirect=/checkout");
      return;
    }

    if (items.length === 0) {
      router.replace("/cart");
      return;
    }

    loadPrimaryAddress();
  }, [authInitialized, isAuthenticated, items]);

  /* ---------------- Load Primary Address ---------------- */

  const loadPrimaryAddress = async () => {
    if (!user) return;

    const q = query(
      collection(dbClient, "users", user.uid, "addresses"),
      where("isDefault", "==", true)
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      setAddress({
        id: snap.docs[0].id,
        ...(snap.docs[0].data() as Address),
      });
    }

    setLoading(false);
  };

  if (!authInitialized || loading) {
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
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    document.body.appendChild(script);
  });


const handlePlaceOrder = async () => {
  if (!user || !address || items.length === 0) return;

  try {
    setLoading(true);

    const now = Date.now();

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
      subtotal: total,
      shipping: 0,
      total,
      address,
      status: "pending",
      createdAt: now,
      updatedAt: now,
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

      handler: async function (response: any) {
        // 5️⃣ Update order → paid
        await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            ...response,
          }),
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
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();

  } catch (err) {
    console.error("❌ Payment error:", err);
    const message = err instanceof Error ? err.message : "Payment failed";
    alert(`${message}. Please try again.`);
  } finally {
    setLoading(false);
  }
};




  /* ---------------- UI ---------------- */

  return (
    <div
      className="min-h-screen px-6 py-12"
      style={{ background: "var(--panel-bg)", color: "var(--fg)" }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">

          {/* HEADER */}
          <div>
            <h1 className="text-2xl font-semibold mb-2">Checkout</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Review your order and confirm delivery details
            </p>
          </div>

          {/* DELIVERY ADDRESS */}
          <section
            className="rounded-2xl p-6"
            style={{
              background: "var(--panel-bg-soft)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-medium">Delivery Address</h2>
<Link href="/addresses?redirect=/checkout">Change</Link>

            </div>

            {address ? (
              <div className="text-sm space-y-1">
                <p className="font-medium">{address.fullName}</p>
                <p>{address.phone}</p>
                <p>
                  {address.line1}, {address.city}, {address.state}{" "}
                  {address.postalCode}
                </p>
                <p>{address.country}</p>
              </div>
            ) : (
              <div className="text-sm">
                <p style={{ color: "var(--muted)" }}>
                  No delivery address selected.
                </p>
                <Link
                  href="/addresses?redirect=/checkout"
                  className="inline-block mt-3 text-sm"
                  style={{ color: "rgb(212,175,55)" }}
                >
                  Add address →
                </Link>
              </div>
            )}
          </section>

          {/* ORDER ITEMS */}
          <section
            className="rounded-2xl p-6"
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
              <span>₹{total}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span style={{ color: "rgb(212,175,55)" }}>Free</span>
            </div>

            <div
              className="flex justify-between pt-3 mt-3 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span className="font-medium">Total</span>
              <span className="font-medium">₹{total}</span>
            </div>
          </div>

            <button
            onClick={handlePlaceOrder}
            disabled={!address || loading}
            className="w-full rounded-xl py-3 font-medium transition"
            style={{
                background: !address
                ? "rgba(0,0,0,0.2)"
                : "linear-gradient(to right, #fcd34d, #fbbf24)",
                color: !address ? "var(--muted)" : "#000",
                cursor: !address ? "not-allowed" : "pointer",
            }}
            >
            {loading ? "Placing order…" : "Place Order"}
            </button>
          {!address && (
            <p
              className="text-xs mt-3"
              style={{ color: "var(--muted)" }}
            >
              Please add a delivery address to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
