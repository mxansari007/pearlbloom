"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Minus } from "lucide-react";

import { useBuyNowStore } from "@/store/useBuyNowStore";
import { useAppConfigStore, useAuthStore } from "@/store/useAppStore";
import type { Address } from "@/types/user";
import { placeOrder } from "@/utils/placeorder";
import { track } from "@/utils/analytics";
import CheckoutAddressSection from "@/components/CheckoutAddressSection";

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

export default function BuyNowCheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, authInitialized } = useAuthStore();
  const configLoaded = useAppConfigStore((s) => s.configLoaded);
  const globalShippingRate = useAppConfigStore((s) => s.shippingRate);
  const freeShippingAbove = useAppConfigStore((s) => s.freeShippingAbove);

  const { item, updateQty, clearBuyNowItem, getTotal } = useBuyNowStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  useEffect(() => {
    if (!item) return;
    track("checkout_viewed", {
      source: "buy_now_checkout",
      cart_item_count: item.quantity || 1,
      cart_unique_items: 1,
      cart_value: getTotal(),
      product_id: item.productId || item.id,
      variant_id: item.variantId || item.id,
      sku: item.sku,
      slug: item.slug,
    });
  }, [item, getTotal]);

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
    if (authInitialized && !item && !isOrderPlaced) {
        router.replace("/");
    }
  }, [authInitialized, item, router, isOrderPlaced]);

  /* ---------------- Payment Logic ---------------- */

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (getRazorpayConstructor()) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async () => {
    if (!configLoaded || !user || !address || !item) return;

    try {
      setLoading(true);

      const now = Date.now();
      const subtotal = getTotal();
      const eligibleForFreeShipping =
        typeof freeShippingAbove === "number" &&
        freeShippingAbove > 0 &&
        subtotal >= freeShippingAbove;
      const rate =
        typeof item.shippingRate === "number" && item.shippingRate > 0
          ? item.shippingRate
          : globalShippingRate;
      const shippingBase = rate * (item.quantity || 1);
      const shipping = eligibleForFreeShipping ? 0 : shippingBase;
      const total = subtotal + shipping;

      track("checkout_submitted", {
        source: "buy_now_checkout",
        cart_item_count: item.quantity || 1,
        cart_unique_items: 1,
        cart_value: subtotal,
        shipping,
        total,
        product_id: item.productId || item.id,
        variant_id: item.variantId || item.id,
        sku: item.sku,
        slug: item.slug,
      });

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
        subtotal,
        shipping,
        total,
        address,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });

      track("order_created", {
        order_id: orderId,
        source: "buy_now_checkout",
        cart_item_count: item.quantity || 1,
        cart_unique_items: 1,
        cart_value: subtotal,
        shipping,
        total,
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
        handler: async function (response: RazorpaySuccessResponse) {
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
              track("payment_succeeded", {
                order_id: orderId,
                verified: true,
                source: "buy_now_checkout",
                cart_item_count: item.quantity || 1,
                cart_unique_items: 1,
                cart_value: subtotal,
                shipping,
                total,
              });
              // Success!
              setIsOrderPlaced(true);
              clearBuyNowItem();
              
              const finalDisplayId = verifyData.displayId || `PB-${new Date(now).toISOString().split("T")[0]}-${orderId.slice(-6).toUpperCase()}`;
              router.replace(`/order-success/${finalDisplayId}?clearCart=false`);
            } else {
              track("payment_failed", {
                order_id: orderId,
                verified: false,
                source: "buy_now_checkout",
                cart_item_count: item.quantity || 1,
                cart_unique_items: 1,
                cart_value: subtotal,
                shipping,
                total,
              });
              alert("Payment verification failed. Please contact support.");
              setVerifying(false);
            }
          } catch (err) {
            console.error("Verification error:", err);
            track("payment_failed", {
              order_id: orderId,
              source: "buy_now_checkout",
              cart_item_count: item.quantity || 1,
              cart_unique_items: 1,
              cart_value: subtotal,
              shipping,
              total,
            });
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
             // Only redirect if NOT currently verifying a success response
             if (!isOrderPlaced) {
                 track("payment_cancelled", {
                   order_id: orderId,
                   source: "buy_now_checkout",
                   cart_item_count: item.quantity || 1,
                   cart_unique_items: 1,
                   cart_value: subtotal,
                   shipping,
                   total,
                 });
                 setIsOrderPlaced(true); // Prevent guard from redirecting to home
                 setTimeout(() => {
                    const clearBuyNowItem = useBuyNowStore.getState().clearBuyNowItem;
                    clearBuyNowItem();
                    
                    // Construct displayId manually
                    const date = new Date().toISOString().split("T")[0];
                    const displayId = `PB-${date}-${orderId.slice(-6).toUpperCase()}`;
                    router.replace(`/orders/${displayId}`);
                 }, 200);
             }
          },
        },
      };

      const Razorpay = getRazorpayConstructor();
      if (!Razorpay) {
        throw new Error("Razorpay SDK failed to load");
      }
      const paymentObject = new Razorpay(options);
      
      // Handle explicit payment failures
      paymentObject.on("payment.failed", function (response: unknown) {
          console.error("Payment failed:", response);
          track("payment_failed", {
            order_id: orderId,
            source: "buy_now_checkout",
            cart_item_count: item.quantity || 1,
            cart_unique_items: 1,
            cart_value: subtotal,
            shipping,
            total,
          });
          
          setIsOrderPlaced(true); // Prevent guard from redirecting to home
          const clearBuyNowItem = useBuyNowStore.getState().clearBuyNowItem;
          clearBuyNowItem();
          
          const date = new Date().toISOString().split("T")[0];
          const displayId = `PB-${date}-${orderId.slice(-6).toUpperCase()}`;
          router.replace(`/orders/${displayId}`);
      });

      track("payment_started", { order_id: orderId, amount: total, currency: "INR", source: "buy_now_checkout", cart_value: subtotal, shipping });
      paymentObject.open();
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      alert(message);
      setLoading(false);
    }
  };

  const subtotal = getTotal();
  const eligibleForFreeShipping =
    typeof freeShippingAbove === "number" &&
    freeShippingAbove > 0 &&
    subtotal >= freeShippingAbove;
  const shippingBase =
    (item
      ? (typeof item.shippingRate === "number" && item.shippingRate > 0 ? item.shippingRate : globalShippingRate) *
        (item.quantity || 1)
      : 0);
  const shipping = configLoaded ? (eligibleForFreeShipping ? 0 : shippingBase) : 0;
  const total = subtotal + shipping;

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
            {user?.uid ? (
              <CheckoutAddressSection
                userId={user.uid}
                title="Shipping Address"
                selectedAddressId={selectedAddressId}
                onSelectAddressId={setSelectedAddressId}
                onSelectedAddress={setAddress}
              />
            ) : null}
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
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Shipping</span>
                {!configLoaded ? (
                  <span style={{ color: "var(--muted)" }}>—</span>
                ) : eligibleForFreeShipping ? (
                  <span style={{ color: "rgb(212,175,55)" }}>Free</span>
                ) : (
                  <span>₹{shipping.toLocaleString("en-IN")}</span>
                )}
              </div>

              {configLoaded &&
                typeof freeShippingAbove === "number" &&
                freeShippingAbove > 0 &&
                shippingBase > 0 &&
                !eligibleForFreeShipping && (
                <div
                  className="text-xs rounded-xl px-3 py-2"
                  style={{
                    background: "rgba(var(--gold-rgb),0.10)",
                    border: "1px solid rgba(var(--gold-rgb),0.22)",
                    color: "rgb(var(--gold-rgb))",
                  }}
                >
                  Add ₹{Math.max(0, freeShippingAbove - subtotal).toLocaleString("en-IN")} more to unlock free shipping.
                </div>
              )}

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
              disabled={!configLoaded || !address || loading}
              className="w-full rounded-xl py-3 font-medium transition"
              style={{
                background: !configLoaded || !address
                  ? "rgba(0,0,0,0.2)"
                  : "linear-gradient(to right, #fcd34d, #fbbf24)",
                color: !configLoaded || !address ? "var(--muted)" : "#000",
                cursor: !configLoaded || !address ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Placing order…" : "Place Order"}
            </button>
            {!configLoaded ? (
              <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
                Loading shipping rates…
              </p>
            ) : !address ? (
              <p
                className="text-xs mt-3"
                style={{ color: "var(--muted)" }}
              >
                Please add a delivery address to continue.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
