"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

export default function OrderSuccessClient({
  displayId,
}: {
  displayId: string;
}) {
  const clearCart = useCartStore((s) => s.clear);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    console.log("Order Success for:", displayId);
    }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Order Placed 🎉</h1>
        <p className="text-sm mb-6">Your order has been successfully placed.</p>
        <p className="text-xs mb-6">Order ID: {displayId}</p>

        <Link
          href={`/orders/${displayId}`}
          className="inline-block rounded-xl bg-yellow-400 px-6 py-3 text-black"
        >
          View Your Order
        </Link>
      </div>
    </div>
  );
}
