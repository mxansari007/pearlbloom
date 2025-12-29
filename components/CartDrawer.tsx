"use client";

import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";

export default function CartDrawer() {
  const { items, isOpen, close, removeItem } = useCartStore();

  const total = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <div
      className={`fixed inset-0 z-50 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={close}
        className={`absolute inset-0 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "var(--overlay-bg)",
        }}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md
        transform transition-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "var(--panel-bg)",
          borderLeft: "1px solid var(--border-subtle)",
          color: "var(--fg)",
        }}
      >
        {/* 🔴 Glow Background */}
        <div className="glow-bg">
          <span className="glow-orb" />
          <span className="glow-orb" />
          <span className="glow-orb" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <h2 className="text-lg font-medium">Your Cart</h2>
            <button
              onClick={close}
              className="text-xl transition"
              style={{ color: "var(--muted)" }}
            >
              ×
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Your cart is empty.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
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
                    {item.variantLabel && (
                      <p
                        className="text-xs"
                        style={{ color: "rgb(212,175,55)" }}
                      >
                        {item.variantLabel}
                      </p>
                    )}
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs transition"
                    style={{ color: "#ef4444" }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4"
            style={{
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex justify-between mb-4">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <Link
              href="/cart"
              onClick={close}
              className="block text-center rounded-xl
                         bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500
                         py-3 text-black font-medium
                         hover:brightness-110 transition"
            >
              View Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
