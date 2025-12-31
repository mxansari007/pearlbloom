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
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

import { dbClient } from "@/libs/firebase-client";
import { useAuthStore } from "@/store/useAppStore";
import type { Order, OrderItem } from "@/types/orders";
import type { Review } from "@/types/reviews";
import WriteReviewModal from "@/components/WriteReviewModal";
import { track } from "@/utils/analytics";

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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [orderReviews, setOrderReviews] = useState<Review[]>([]);
  
  // Timer & Retry State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);

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

      // Enrich items with slugs if missing (for older orders)
      const enrichedItems = await Promise.all(
        data.items.map(async (item) => {
          if (item.slug) return item;

          try {
            const productRef = doc(dbClient, "products", item.productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
              const pData = productSnap.data();
              return { ...item, slug: pData.slug };
            }
          } catch (e) {
            console.error("Failed to fetch slug for product", item.productId);
          }
          return item;
        })
      );

      setOrder({ id: docSnap.id, ...data, items: enrichedItems });
      track("order_details_viewed", {
        display_id: data.displayId || displayId,
        order_status: data.status,
        order_total: data.total,
        item_count: enrichedItems.reduce((sum, i) => sum + i.quantity, 0),
      });
    } catch (err) {
      console.error("Failed to load order:", err);
      setError("Unable to load order details.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Timer & Expiry Logic ---------------- */

  useEffect(() => {
    if (!order || order.status !== "pending") return;

    // 5 minutes in milliseconds
    const EXPIRY_DURATION = 5 * 60 * 1000;
    const expiresAt = order.createdAt + EXPIRY_DURATION;

    const checkTimer = () => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        handleDeleteOrder();
      } else {
        setTimeLeft(diff);
      }
    };

    // Initial check
    checkTimer();

    // Interval
    const timerId = setInterval(checkTimer, 1000);

    return () => clearInterval(timerId);
  }, [order]);

  const handleDeleteOrder = async () => {
    if (!order || !order.id) return;
    try {
      await deleteDoc(doc(dbClient, "orders", order.id));
      router.replace("/orders");
    } catch (err) {
      console.error("Failed to delete expired order", err);
    }
  };

  /* ---------------- Retry Payment Logic ---------------- */

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (getRazorpayConstructor()) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      document.body.appendChild(script);
    });

  const handleRetryPayment = async () => {
    if (!order || !order.id) return;
    setRetrying(true);

    try {
      await loadRazorpay();

      // Create new Razorpay order
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: order.total,
          receipt: order.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to create payment order");
      const razorpayOrder = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "Pearl Boom",
        description: "Retry Order Payment",
        order_id: razorpayOrder.id,
        handler: async function (response: RazorpaySuccessResponse) {
          // Verify
          await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              ...response,
            }),
          });
          
          // Reload order to update status
          loadOrder();
        },
        prefill: {
          name: order.address.fullName,
          email: user?.email || "",
          contact: order.phone || "",
        },
        theme: {
          color: "#d4af37",
        },
        modal: {
            ondismiss: () => {
                setRetrying(false);
            }
        }
      };

      const Razorpay = getRazorpayConstructor();
      if (!Razorpay) {
        throw new Error("Razorpay SDK failed to load");
      }

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", function (response: unknown) {
         console.error("Payment failed", response);
         alert("Payment failed. Please try again.");
         setRetrying(false);
      });
      
      rzp.open();

    } catch (err) {
      console.error("Retry payment error:", err);
      alert("Failed to initiate payment. Please try again.");
      setRetrying(false);
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

  const handleWriteReview = (item: OrderItem) => {
    setSelectedItem(item);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    // Refresh reviews to update UI
    const fetchReviews = async () => {
      if (!order?.id) return;
      try {
        const reviewsQ = query(
          collection(dbClient, "reviews"),
          where("orderId", "==", order.id)
        );
        const reviewsSnap = await getDocs(reviewsQ);
        const loadedReviews = reviewsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Review, "id">),
        }));
        setOrderReviews(loadedReviews);
      } catch (err) {
        console.error("Failed to refresh reviews", err);
      }
    };
    fetchReviews();
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

        {/* TRACKING DETAILS */}
        {order.tracking?.awb && (
          <section className="order-page__section">
            <h2 className="order-page__section-title">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Shipment Tracking
            </h2>

            <div className="bg-[var(--panel-bg-soft)] rounded-lg p-4 border border-[var(--border-subtle)]">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted">Tracking Number (AWB)</p>
                  <p className="font-mono font-medium text-lg">{order.tracking.awb}</p>
                  {order.tracking.carrier && (
                    <p className="text-sm text-muted mt-1">Carrier: {order.tracking.carrier}</p>
                  )}
                </div>
              </div>

              {order.tracking.events && order.tracking.events.length > 0 ? (
                <div className="relative pl-4 border-l-2 border-[var(--border-subtle)] space-y-6">
                  {order.tracking.events.map((event, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[rgb(var(--gold-rgb))]" />
                      <p className="font-medium">{event.status}</p>
                      <p className="text-sm text-muted mt-0.5">{event.location}</p>
                      <p className="text-xs text-muted mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      {event.message && (
                        <p className="text-sm mt-1 opacity-80">{event.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <p>No tracking updates available yet.</p>
                  {order.tracking.trackingUrl && (
                    <a
                      href={order.tracking.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[rgb(var(--gold-rgb))] hover:underline mt-2 inline-block"
                    >
                      Track Shipment
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* PAYMENT TIMER & RETRY */}
        {order.status === "pending" && timeLeft !== null && (
          <section className="order-page__section border border-red-200 bg-red-50 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-red-700">
                <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-lg">Payment Pending</h3>
                  <p className="text-sm opacity-90">
                    Order expires in <span className="font-mono font-bold text-lg">
                      {Math.floor(timeLeft / 60000)}:
                      {String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0')}
                    </span>
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleRetryPayment}
                disabled={retrying}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                {retrying ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </section>
        )}

        {/* ITEMS */}
        <section className="order-page__section">
          <h2 className="order-page__section-title">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Order Items ({itemCount})
          </h2>

          <div className="order-page__items">
            {order.items.map((item, idx) => {
              const itemReview = orderReviews.find(
                (r) => r.productId === item.productId
              );

              return (
                <div key={idx} className="order-page__item">
                  <Link
                    href={item.slug ? `/product/${item.slug}` : "#"}
                    className={`order-page__item-image ${!item.slug ? "pointer-events-none" : ""}`}
                  >
                    <Image
                      src={item.image || "/images/placeholder.svg"}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                    {item.quantity > 1 && (
                      <span className="order-page__item-qty-badge">
                        ×{item.quantity}
                      </span>
                    )}
                  </Link>

                  <div className="order-page__item-details">
                    <Link
                      href={item.slug ? `/product/${item.slug}` : "#"}
                      className={`order-page__item-name hover:text-[rgb(var(--gold-rgb))] transition-colors ${!item.slug ? "pointer-events-none" : ""}`}
                    >
                      {item.name}
                    </Link>

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
                  
                  {itemReview ? (
                    <div className="text-xs font-medium text-green-400 mt-3 flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Review Submitted
                    </div>
                  ) : (
                    order.status === 'delivered' && (
                      <button 
                        onClick={() => handleWriteReview(item)}
                        className="text-xs font-medium text-[rgb(var(--gold-rgb))] hover:text-yellow-400 mt-3 flex items-center gap-1.5 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <path d="M12 .587l3.668 7.431L24 9.748l-6 5.84 1.42 8.28L12 19.771 4.58 23.868 6 15.588 0 9.748l8.332-1.73z" />
                        </svg>
                        Write a Review
                      </button>
                    )
                  )}
                </div>

                <div className="order-page__item-total">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </div>
              </div>
            );
          })}
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

      {selectedItem && (
        <WriteReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedItem(null);
          }}
          onSuccess={handleReviewSuccess}
          product={selectedItem}
          orderId={order.id}
        />
      )}
    </div>
  );
}
