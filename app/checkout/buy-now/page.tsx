"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus } from "lucide-react";

import { useBuyNowStore } from "@/store/useBuyNowStore";
import { useAuthStore } from "@/store/useAppStore";
import { dbClient } from "@/libs/firebase-client";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Address } from "@/types/user";
import { placeOrder } from "@/utils/placeorder";

export default function BuyNowCheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, authInitialized } = useAuthStore();

  const { item, updateQty, clearBuyNowItem, getTotal } = useBuyNowStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  /* ---------------- Auth Guard ---------------- */

  useEffect(() => {
    if (!authInitialized) return;

    if (!isAuthenticated || !user) {
      router.replace(`/login?redirect=/checkout/buy-now`);
      return;
    }
  }, [authInitialized, isAuthenticated, user, router]);

  /* ---------------- Item Guard ---------------- */
  useEffect(() => {
    if (authInitialized && !item) {
        router.replace("/");
    }
  }, [authInitialized, item, router]);

  /* ---------------- Load Addresses ---------------- */

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const q = query(collection(dbClient, "users", user.uid, "addresses"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Address));
      setAddresses(list);

      // Select default or first
      const def = list.find((a) => a.isDefault);
      if (def) setSelectedAddressId(def.id!);
      else if (list.length > 0) setSelectedAddressId(list[0].id!);
    } catch (err) {
      console.error("Failed to load addresses", err);
    }
  };

  /* ---------------- Payment Logic ---------------- */

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async () => {
    if (!user || !address || !item) return;

    try {
      setLoading(true);

      const now = Date.now();
      const total = getTotal();

      // 1️⃣ Create order in Firestore
      const orderId = await placeOrder({
        userId: user.uid,
        phone: user.phone || "",
        items: [{
          productId: item.productId || item.id,
          variantId: item.variantId || item.id,
          name: item.name || "",
          variantLabel: item.variantLabel || "",
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.image || "",
          sku: item.sku || "",
          slug: item.slug || "",
        }],
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
        throw new Error("Invalid Razorpay order ID received");
      }

      // 4️⃣ Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Pearl Boom",
        description: `Order #${orderId.slice(-6).toUpperCase()}`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          setVerifying(true);
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId, // Send the Firestore Doc ID to update status
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // Success!
              clearBuyNowItem();
              router.replace(`/order-success/${verifyData.displayId}`);
            } else {
              alert("Payment verification failed. Please contact support.");
              setVerifying(false);
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment verification error. Please contact support.");
            setVerifying(false);
          }
        },
        prefill: {
          name: address.fullName,
          email: user.email,
          contact: address.phone,
        },
        theme: {
          color: "#D4AF37",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const address = addresses.find((a) => a.id === selectedAddressId);
  const total = getTotal();

  if (!authInitialized || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--panel-bg)", color: "var(--muted)" }}
      >
        {verifying ? "Verifying payment…" : "Preparing checkout…"}
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 bg-[var(--bg-color)]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Address & Review */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address Section */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--panel-bg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Shipping Address</h2>
              <Link
                href="/addresses?redirect=/checkout/buy-now"
                className="text-sm font-medium hover:underline"
                style={{ color: "rgb(var(--gold-rgb))" }}
              >
                Manage Addresses
              </Link>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <p className="mb-4" style={{ color: "var(--muted)" }}>
                  You don&apos;t have any saved addresses.
                </p>
                <Link
                  href="/addresses?redirect=/checkout/buy-now"
                  className="inline-block px-6 py-2 rounded-lg font-medium transition"
                  style={{
                    background: "var(--btn-primary-bg)",
                    color: "var(--btn-primary-text)",
                  }}
                >
                  Add New Address
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id!)}
                    className={`relative p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      selectedAddressId === addr.id
                        ? "border-[rgb(var(--gold-rgb))]"
                        : "border-transparent hover:border-[var(--border-subtle)]"
                    }`}
                    style={{ background: "var(--bg-color)" }}
                  >
                    <div className="font-medium mb-1">{addr.fullName}</div>
                    <div className="text-sm" style={{ color: "var(--muted)" }}>
                      {addr.line1}
                      {addr.line2 && `, ${addr.line2}`}
                      <br />
                      {addr.city}, {addr.state} {addr.postalCode}
                      <br />
                      {addr.country}
                    </div>
                    <div className="mt-2 text-sm">{addr.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Item Review Section */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--panel-bg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h2 className="text-xl font-medium mb-4">Review Item</h2>
            
            <div className="flex gap-4 p-4 rounded-xl" style={{ background: "var(--bg-color)" }}>
                {/* Image */}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                    )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-medium line-clamp-2">{item.name}</h3>
                        {item.variantLabel && (
                            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                                {item.variantLabel}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => updateQty(Math.max(1, item.quantity - 1))}
                                className="p-1 rounded-md transition hover:bg-white/10"
                                style={{ border: "1px solid var(--border-subtle)" }}
                            >
                                <Minus size={14} />
                            </button>
                            <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                            <button 
                                onClick={() => updateQty(item.quantity + 1)}
                                className="p-1 rounded-md transition hover:bg-white/10"
                                style={{ border: "1px solid var(--border-subtle)" }}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        
                        <div className="font-medium">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Summary */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl p-6 sticky top-24"
            style={{
              background: "var(--panel-bg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h2 className="text-xl font-medium mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Subtotal</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Shipping</span>
                <span style={{ color: "rgb(212,175,55)" }}>Free</span>
              </div>

              <div
                className="flex justify-between pt-3 mt-3 border-t"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <span className="font-medium">Total</span>
                <span className="font-medium">₹{total.toLocaleString("en-IN")}</span>
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
    </div>
  );
}
