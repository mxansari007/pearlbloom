"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { dbClient } from "@/libs/firebase-client";
import { useAuthStore } from "@/store/useAppStore";
import type { Order } from "@/types/orders";
import { track } from "@/utils/analytics";

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, authInitialized } = useAuthStore();

  const trackedCountRef = useRef<number | null>(null);

  const { data: orders = [], error, isLoading } = useSWR(
    authInitialized && isAuthenticated && user?.uid ? ["orders", user.uid] : null,
    async ([, uid]: [string, string]) => {
      // Scope the query to this user. Required by Firestore security rules
      // (which only allow reading your own orders) and avoids downloading the
      // entire orders collection just to filter it client-side.
      const q = query(
        collection(dbClient, "orders"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Order),
      }));
    }
  );

  useEffect(() => {
    if (!authInitialized || !isAuthenticated || !user?.uid) return;
    if (isLoading) return;
    if (error) return;
    if (trackedCountRef.current === orders.length) return;
    track("orders_list_viewed", { orders_count: orders.length });
    trackedCountRef.current = orders.length;
  }, [authInitialized, isAuthenticated, user?.uid, isLoading, error, orders.length]);

  /* ---------------- Auth Guard ---------------- */

  useEffect(() => {
    if (!authInitialized) return;

    if (!isAuthenticated || !user) {
      router.replace("/login?redirect=/orders");
      return;
    }
  }, [authInitialized, isAuthenticated, user, router]);

  /* ---------------- Status Helpers ---------------- */

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "#22c55e";
      case "shipped":
        return "#3b82f6";
      case "paid":
        return "#22c55e";
      case "pending":
        return "#eab308";
      default:
        return "#ef4444";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered";
      case "shipped":
        return "Shipped";
      case "paid":
        return "Confirmed";
      case "pending":
        return "Processing";
      default:
        return status;
    }
  };

  /* ---------------- UI States ---------------- */

  if (!authInitialized || isLoading) {
    return (
      <div className="orders-page">
        <div className="orders-page__loading">
          <div className="orders-page__spinner" />
          <p>Loading your orders…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="orders-page__loading">
          <p>Unable to load orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-page__container">

        {/* HEADER */}
        <header className="orders-page__header">
          <div>
            <h1 className="orders-page__title">My Orders</h1>
            <p className="orders-page__subtitle">Track and manage your purchases</p>
          </div>
          <Link href="/" className="orders-page__shop-link">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Continue Shopping
          </Link>
        </header>

        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          Need help with an order? Email{" "}
          <a href="mailto:orders@pearlbloom.in" style={{ color: "rgb(var(--gold-rgb))", textDecoration: "underline" }}>
            orders@pearlbloom.in
          </a>
        </p>

        {/* EMPTY STATE */}
        {orders.length === 0 ? (
          <div className="orders-page__empty">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h2 className="orders-page__empty-title">No orders yet</h2>
            <p className="orders-page__empty-text">
              Looks like you haven&apos;t placed any orders. Start shopping to see your orders here.
            </p>
            <Link href="/" className="orders-page__cta">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="orders-page__stats">
              <div className="orders-page__stat">
                <span className="orders-page__stat-value">{orders.length}</span>
                <span className="orders-page__stat-label">Total Orders</span>
              </div>
              <div className="orders-page__stat">
                <span className="orders-page__stat-value">
                  {orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
                </span>
                <span className="orders-page__stat-label">Items Purchased</span>
              </div>
              <div className="orders-page__stat orders-page__stat--highlight">
                <span className="orders-page__stat-value">
                  ₹{orders.reduce((sum, o) => sum + o.total, 0).toLocaleString("en-IN")}
                </span>
                <span className="orders-page__stat-label">Total Spent</span>
              </div>
            </div>

            {/* Orders List */}
            <div className="orders-page__list">
              {orders.map((order) => {
                const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <div key={order.id} className="orders-page__card">
                    {/* Card Header */}
                    <div className="orders-page__card-header">
                      <div className="orders-page__card-id">
                        <span className="orders-page__card-label">Order</span>
                        <span className="font-mono">{order.displayId}</span>
                      </div>
                      <div
                        className="orders-page__status"
                        style={{ background: `${getStatusColor(order.status)}15`, color: getStatusColor(order.status) }}
                      >
                        <span className="orders-page__status-dot" style={{ background: getStatusColor(order.status) }} />
                        {getStatusLabel(order.status)}
                      </div>
                    </div>

                    {/* Card Meta */}
                    <div className="orders-page__card-meta">
                      <span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                      <span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>

                    {/* Items Preview */}
                    <div className="orders-page__items">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="orders-page__item">
                          <div className="orders-page__item-image">
                            <Image
                              src={item.image || "/images/placeholder.svg"}
                              alt={item.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                            {item.quantity > 1 && (
                              <span className="orders-page__item-qty">×{item.quantity}</span>
                            )}
                          </div>
                          <div className="orders-page__item-info">
                            <p className="orders-page__item-name">{item.name}</p>
                            {item.variantLabel && (
                              <p className="orders-page__item-variant">{item.variantLabel}</p>
                            )}
                            <p className="orders-page__item-price">
                              ₹{item.price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="orders-page__more-items">
                          +{order.items.length - 3} more
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="orders-page__card-footer">
                      <div className="orders-page__total">
                        <span className="orders-page__total-label">Total</span>
                        <span className="orders-page__total-value">₹{order.total.toLocaleString("en-IN")}</span>
                      </div>
                      <button
                        onClick={() => router.push(`/orders/${order.displayId}`)}
                        className="orders-page__view-btn"
                      >
                        View Details
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
