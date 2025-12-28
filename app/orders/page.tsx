"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { dbClient } from "@/libs/firebase-client";
import { useAuthStore } from "@/store/useAppStore";
import type { Order } from "@/types/orders";

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, authInitialized } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- Auth Guard ---------------- */

  useEffect(() => {
    if (!authInitialized) return;

    if (!isAuthenticated || !user) {
      router.replace("/login?redirect=/orders");
      return;
    }

    loadOrders();
  }, [authInitialized, isAuthenticated, user]);

  /* ---------------- Load Orders ---------------- */

  const loadOrders = async () => {
    if (!user) return;

    const q = query(
      collection(dbClient, "orders"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    const userOrders = snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Order),
      }))
      .filter((o) => o.userId === user.uid);

    setOrders(userOrders);
    setLoading(false);
  };

  /* ---------------- UI States ---------------- */

  if (!authInitialized || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--panel-bg)", color: "var(--muted)" }}
      >
        Loading your orders…
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-6 py-12"
      style={{ background: "var(--panel-bg)", color: "var(--fg)" }}
    >
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">My Orders</h1>
          <Link
            href="/"
            className="text-sm"
            style={{ color: "rgb(212,175,55)" }}
          >
            Continue Shopping →
          </Link>
        </div>

        {/* EMPTY STATE */}
        {orders.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              background: "var(--panel-bg-soft)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p className="mb-4" style={{ color: "var(--muted)" }}>
              You haven’t placed any orders yet.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl
                         bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500
                         px-6 py-3 text-black font-medium"
            >
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl p-6"
                style={{
                  background: "var(--panel-bg-soft)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {/* ORDER HEADER */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium">
                      Order #{order.displayId}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className="text-xs font-medium capitalize"
                    style={{
                      color:
                        order.status === "paid"
                          ? "rgb(34,197,94)"
                          : order.status === "pending"
                          ? "rgb(234,179,8)"
                          : "rgb(239,68,68)",
                    }}
                  >
                    {order.status}
                  </span>
                </div>

                {/* ITEMS */}
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 items-center"
                    >
                      <div
                        className="relative w-16 h-16 rounded-xl overflow-hidden"
                        style={{
                          background: "var(--panel-bg)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <Image
                          src={item.image || ""}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p
                          className="text-xs"
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

                {/* FOOTER */}
                <div
                  className="flex justify-between items-center mt-6 pt-4"
                  style={{
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <span className="text-sm">
                    Total: <strong>₹{order.total}</strong>
                  </span>

                    <button
                onClick={() => router.push(`/orders/${order.displayId}`)}
                className="text-sm font-medium transition"
                style={{ color: "rgb(212,175,55)" }}
                >
                View Details →
                </button>   
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
