"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { dbClient } from "@/libs/firebase-client";
import { useAuthStore } from "@/store/useAppStore";
import type { Order } from "@/types/orders";

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "paid", label: "Payment Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderDetailsPage() {
  const { displayId } = useParams<{ displayId: string }>();
  const router = useRouter();

  const { user, isAuthenticated, authInitialized } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- Auth Guard ---------------- */

  useEffect(() => {
    if (!authInitialized) return;

    if (!isAuthenticated || !user) {
      router.replace(`/login?redirect=/orders/${displayId}`);
      return;
    }

    loadOrder();
  }, [authInitialized, isAuthenticated, user, displayId]);

  /* ---------------- Load Order by displayId ---------------- */

  const loadOrder = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(dbClient, "orders"),
        where("displayId", "==", displayId)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        router.replace("/orders");
        return;
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data() as Order;

      // 🔐 Ownership check
      if (data.userId !== user?.uid) {
        router.replace("/orders");
        return;
      }

      setOrder({ id: docSnap.id, ...data });
    } catch (err) {
      console.error("Failed to load order:", err);
      setError("Unable to load order details.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- States ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading order details…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={() => router.replace("/orders")}
          className="text-[rgb(212,175,55)] text-sm"
        >
          Go back to orders
        </button>
      </div>
    );
  }

  if (!order) return null;

  /* ---------------- Helpers ---------------- */

  const currentIndex = STATUS_STEPS.findIndex(
    (s) => s.key === order.status
  );

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen px-6 py-12 bg-[var(--panel-bg)] text-[var(--fg)]">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* HEADER */}
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2 max-w-full">
            <h1 className="text-3xl font-semibold">Order</h1>

            <div className="inline-flex items-center gap-3 rounded-xl px-4 py-2 bg-black/5 border border-black/10">
              <span className="text-sm text-muted-foreground">
                Order ID
              </span>

              <span className="font-mono text-sm tracking-wide whitespace-nowrap">
                {order.displayId}
              </span>

              <button
                onClick={() =>
                  navigator.clipboard.writeText(order.displayId)
                }
                className="text-xs opacity-60 hover:opacity-100 transition"
              >
                Copy
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <Link
            href="/orders"
            className="text-sm text-[rgb(212,175,55)] whitespace-nowrap"
          >
            ← Back to Orders
          </Link>
        </header>

        {/* STATUS */}
        <section className="rounded-2xl p-6 bg-[var(--panel-bg-soft)] border border-[var(--border-subtle)]">
          <h2 className="text-lg font-medium mb-6">Order Status</h2>

          <div className="flex items-center justify-between relative">
            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx <= currentIndex;
              const isActive = idx === currentIndex;

              return (
                <div key={step.key} className="flex-1 text-center relative">
                  {idx !== 0 && (
                    <div
                      className="absolute top-4 left-0 w-full h-[2px]"
                      style={{
                        background: isDone
                          ? "rgb(34,197,94)"
                          : "var(--border-subtle)",
                      }}
                    />
                  )}

                  <div
                    className="relative z-10 mx-auto w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{
                      background: isDone
                        ? "rgb(34,197,94)"
                        : "var(--panel-bg)",
                      color: isDone ? "#fff" : "var(--muted)",
                      border: isActive
                        ? "2px solid rgb(34,197,94)"
                        : "1px solid var(--border-subtle)",
                    }}
                  >
                    {isDone ? "✓" : idx + 1}
                  </div>

                  <p
                    className="mt-3 text-xs"
                    style={{
                      color: isActive
                        ? "rgb(34,197,94)"
                        : "var(--muted)",
                    }}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ADDRESS */}
        <section className="rounded-2xl p-6 bg-[var(--panel-bg-soft)] border border-[var(--border-subtle)]">
          <h2 className="text-lg font-medium mb-3">Delivery Address</h2>
          <p className="font-medium">{order.address.fullName}</p>
          <p className="text-sm">{order.address.phone}</p>
          <p className="text-sm">
            {order.address.line1}, {order.address.city},{" "}
            {order.address.state} {order.address.postalCode}
          </p>
          <p className="text-sm">{order.address.country}</p>
        </section>

        {/* ITEMS */}
        <section className="rounded-2xl p-6 bg-[var(--panel-bg-soft)] border border-[var(--border-subtle)]">
          <h2 className="text-lg font-medium mb-4">Items</h2>

          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--border-subtle)]">
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
                  <p className="text-sm text-muted-foreground">
                    ₹{item.price} × {item.quantity}
                  </p>
                </div>

                <div className="font-medium">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SUMMARY */}
        <section className="rounded-2xl p-6 bg-[var(--panel-bg-soft)] border border-[var(--border-subtle)]">
          <h2 className="text-lg font-medium mb-4">Order Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-[rgb(212,175,55)]">Free</span>
            </div>

            <div className="flex justify-between pt-3 mt-3 border-t border-[var(--border-subtle)]">
              <span className="font-medium">Total</span>
              <span className="font-medium">₹{order.total}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
