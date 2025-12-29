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
  { key: "pending", label: "Order Placed", icon: "📦" },
  { key: "paid", label: "Payment Confirmed", icon: "✓" },
  { key: "shipped", label: "Shipped", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

export default function OrderDetailsPage() {
  const { displayId } = useParams<{ displayId: string }>();
  const router = useRouter();

  const { user, isAuthenticated, authInitialized } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  /* ---------------- Helpers ---------------- */

  const copyOrderId = () => {
    if (!order?.displayId) return;
    navigator.clipboard.writeText(order.displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ---------------- States ---------------- */

  if (loading) {
    return (
      <div className="order-page">
        <div className="order-page__loading">
          <div className="order-page__spinner" />
          <p>Loading order details…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-page">
        <div className="order-page__error">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>{error}</p>
          <Link href="/orders" className="order-page__error-link">
            Go back to orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  /* ---------------- UI ---------------- */

  return (
    <div className="order-page">
      <div className="order-page__container">

        {/* HEADER */}
        <header className="order-page__header">
          <div className="order-page__header-left">
            <Link href="/orders" className="order-page__back">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Orders
            </Link>

            <h1 className="order-page__title">Order Details</h1>

            <div className="order-page__id-block">
              <span className="order-page__id-label">Order ID</span>
              <div className="order-page__id-value">
                <span className="font-mono">{order.displayId}</span>
                <button onClick={copyOrderId} className="order-page__copy-btn">
                  {copied ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <p className="order-page__date">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(order.createdAt)}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="order-page__stats">
            <div className="order-page__stat">
              <span className="order-page__stat-value">{itemCount}</span>
              <span className="order-page__stat-label">{itemCount === 1 ? "Item" : "Items"}</span>
            </div>
            <div className="order-page__stat order-page__stat--highlight">
              <span className="order-page__stat-value">₹{order.total.toLocaleString("en-IN")}</span>
              <span className="order-page__stat-label">Total</span>
            </div>
          </div>
        </header>

        {/* STATUS TRACKER */}
        <section className="order-page__section">
          <h2 className="order-page__section-title">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Order Status
          </h2>

          <div className="order-page__status-tracker">
            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx <= currentIndex;
              const isActive = idx === currentIndex;

              return (
                <div
                  key={step.key}
                  className={`order-page__status-step ${isDone ? "order-page__status-step--done" : ""} ${isActive ? "order-page__status-step--active" : ""}`}
                >
                  {idx !== 0 && (
                    <div className={`order-page__status-line ${isDone ? "order-page__status-line--done" : ""}`} />
                  )}
                  <div className="order-page__status-dot">
                    {isDone ? "✓" : idx + 1}
                  </div>
                  <p className="order-page__status-label">{step.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ITEMS */}
        <section className="order-page__section">
          <h2 className="order-page__section-title">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Order Items ({itemCount})
          </h2>

          <div className="order-page__items">
            {order.items.map((item, idx) => (
              <div key={idx} className="order-page__item">
                <div className="order-page__item-image">
                  <Image
                    src={item.image || "/images/placeholder.png"}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                  {item.quantity > 1 && (
                    <span className="order-page__item-qty-badge">×{item.quantity}</span>
                  )}
                </div>

                <div className="order-page__item-details">
                  <h3 className="order-page__item-name">{item.name}</h3>

                  {/* Variant Info */}
                  {item.variantLabel && (
                    <div className="order-page__item-variant">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>{item.variantLabel}</span>
                    </div>
                  )}

                  {/* SKU */}
                  {item.sku && (
                    <div className="order-page__item-sku">
                      <span>SKU:</span>
                      <span className="font-mono">{item.sku}</span>
                    </div>
                  )}

                  {/* Price breakdown */}
                  <div className="order-page__item-price-row">
                    <span className="order-page__item-unit-price">₹{item.price.toLocaleString("en-IN")}</span>
                    <span className="order-page__item-multiply">×</span>
                    <span className="order-page__item-quantity">{item.quantity}</span>
                  </div>
                </div>

                <div className="order-page__item-total">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="order-page__grid">
          {/* ADDRESS */}
          <section className="order-page__section">
            <h2 className="order-page__section-title">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delivery Address
            </h2>

            <div className="order-page__address">
              <p className="order-page__address-name">{order.address.fullName}</p>
              <p className="order-page__address-phone">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {order.address.phone}
              </p>
              <p className="order-page__address-line">
                {order.address.line1}
              </p>
              <p className="order-page__address-line">
                {order.address.city}, {order.address.state} {order.address.postalCode}
              </p>
              <p className="order-page__address-country">{order.address.country}</p>
            </div>
          </section>

          {/* SUMMARY */}
          <section className="order-page__section">
            <h2 className="order-page__section-title">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Payment Summary
            </h2>

            <div className="order-page__summary">
              <div className="order-page__summary-row">
                <span>Subtotal ({itemCount} items)</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="order-page__summary-row">
                <span>Shipping</span>
                <span className="order-page__summary-free">Free</span>
              </div>

              <div className="order-page__summary-row order-page__summary-row--total">
                <span>Total Paid</span>
                <span>₹{order.total.toLocaleString("en-IN")}</span>
              </div>

              {order.payment?.razorpayPaymentId && (
                <div className="order-page__payment-info">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Payment ID: </span>
                  <span className="font-mono text-xs">{order.payment.razorpayPaymentId}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* HELP */}
        <section className="order-page__help">
          <p>Need help with your order?</p>
          <Link href="/contact" className="order-page__help-link">
            Contact Support →
          </Link>
        </section>
      </div>
    </div>
  );
}
