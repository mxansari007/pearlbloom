"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";

export default function OrderSuccessClient({
  displayId,
}: {
  displayId: string;
}) {
  const clearCart = useCartStore((s) => s.clear);
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Only clear main cart if NOT from "Buy Now" (which sets clearCart=false)
    const shouldClear = searchParams.get("clearCart") !== "false";
    if (shouldClear) {
      clearCart();
    }
  }, [clearCart, searchParams]);

  const copyOrderId = () => {
    navigator.clipboard.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="order-success">
      {/* Animated Background */}
      <div className="order-success__bg">
        <div className="order-success__confetti" />
      </div>

      <div className="order-success__card">
        {/* Success Icon */}
        <div className="order-success__icon">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="order-success__title">Order Placed Successfully!</h1>

        <p className="order-success__subtitle">
          Thank you for your purchase. We&apos;ll send you an update when your order ships.
        </p>

        {/* Order ID */}
        <div className="order-success__id-block">
          <span className="order-success__id-label">Order ID</span>
          <div className="order-success__id-value">
            <span className="font-mono">{displayId}</span>
            <button onClick={copyOrderId} className="order-success__copy-btn">
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* What's Next */}
        <div className="order-success__steps">
          <div className="order-success__step">
            <div className="order-success__step-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="order-success__step-title">Confirmation Email</p>
              <p className="order-success__step-text">You&apos;ll receive order details via email</p>
            </div>
          </div>

          <div className="order-success__step">
            <div className="order-success__step-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="order-success__step-title">Processing</p>
              <p className="order-success__step-text">Your order is being prepared</p>
            </div>
          </div>

          <div className="order-success__step">
            <div className="order-success__step-icon">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <p className="order-success__step-title">Shipping</p>
              <p className="order-success__step-text">We&apos;ll notify you when it&apos;s on the way</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="order-success__actions">
          <Link href={`/orders/${displayId}`} className="order-success__btn-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Order Details
          </Link>

          <Link href="/" className="order-success__btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
