"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAppStore";

export default function CartPage() {
  const router = useRouter();

  const { items, removeItem } = useCartStore();
  const { isAuthenticated, authInitialized } = useAuthStore();

  const total = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  const handleCheckout = () => {
    // wait until auth state is known
    if (!authInitialized) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/cart");
      return;
    }

    // user is logged in → go to checkout
    router.push("/checkout");
  };

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
          <h1 className="text-2xl font-semibold">Shopping Cart</h1>
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
          <div className="text-center py-24">
            <p className="mb-6" style={{ color: "var(--muted)" }}>
              Your cart is empty.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl
                         bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500
                         px-8 py-3 text-black font-medium"
            >
              Shop Now
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

                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--muted)" }}
                    >
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-sm transition"
                    style={{ color: "#ef4444" }}
                  >
                    Remove
                  </button>
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
                <span>₹{total}</span>
              </div>

              <div className="flex justify-between text-sm mb-6">
                <span>Shipping</span>
                <span style={{ color: "rgb(212,175,55)" }}>Free</span>
              </div>

              <div className="flex justify-between font-medium text-lg mb-6">
                <span>Total</span>
                <span>₹{total}</span>
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
