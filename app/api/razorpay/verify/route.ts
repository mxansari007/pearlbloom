import crypto from "crypto";
import { NextResponse } from "next/server";
import { dbAdmin } from "@/libs/firebase-admin";
import { PostHog } from "posthog-node";

function resolvePostHogIngestionHost(): string {
  const explicit = process.env.POSTHOG_INGESTION_HOST;
  if (explicit) return explicit;

  const candidate = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (candidate?.startsWith("http") && candidate.includes(".i.posthog.com")) {
    return candidate;
  }

  if (candidate?.startsWith("http") && candidate.includes("eu.posthog.com")) {
    return "https://eu.i.posthog.com";
  }

  if (candidate?.startsWith("http") && candidate.includes("posthog.com")) {
    return "https://us.i.posthog.com";
  }

  return "https://eu.i.posthog.com";
}

const posthog =
  process.env.NEXT_PUBLIC_POSTHOG_KEY
    ? new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        host: resolvePostHogIngestionHost(),
      })
    : null;

function getNumberField(obj: unknown, key: string): number | null {
  if (!obj || typeof obj !== "object") return null;
  if (!(key in obj)) return null;
  const value = (obj as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

function getStringField(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (!(key in obj)) return null;
  const value = (obj as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function getObjectField(obj: unknown, key: string): Record<string, unknown> | null {
  if (!obj || typeof obj !== "object") return null;
  if (!(key in obj)) return null;
  const value = (obj as Record<string, unknown>)[key];
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function getQuantity(item: unknown): number {
  return Math.max(0, getNumberField(item, "quantity") ?? 0);
}

export async function POST(req: Request) {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // ✅ Payment verified → mark order paid using Admin SDK
    const orderRef = dbAdmin.collection("orders").doc(orderId);
    
    // Fetch order to get displayId
    const orderSnap = await orderRef.get();
    const orderData = orderSnap.exists ? (orderSnap.data() as Record<string, unknown>) : null;
    const displayId = orderData ? getStringField(orderData, "displayId") : null;

    await orderRef.update({
      status: "paid",
      payment: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      updatedAt: Date.now(),
    });

    const distinctId = orderData ? getStringField(orderData, "userId") : null;
    if (posthog && distinctId) {
      const items = orderData && Array.isArray(orderData.items) ? orderData.items : [];
      const itemCount = items.reduce((sum, i) => sum + getQuantity(i), 0);
      const total = orderData ? getNumberField(orderData, "total") : null;
      const phone = orderData ? getStringField(orderData, "phone") : null;
      const address = orderData ? getObjectField(orderData, "address") : null;
      const fullName = address ? getStringField(address, "fullName") : null;

      await posthog.identifyImmediate({
        distinctId,
        properties: {
          $set: {
            uid: distinctId,
            role: "customer",
            ...(phone ? { phone, $phone: phone } : {}),
            ...(fullName ? { name: fullName, $name: fullName } : {}),
            last_purchase_at: new Date().toISOString(),
          },
          $set_once: {
            first_purchase_at: new Date().toISOString(),
          },
        },
      });

      await posthog.captureImmediate({
        distinctId,
        event: "purchase",
        properties: {
          order_id: orderId,
          display_id: displayId,
          value: total,
          item_count: itemCount,
          currency: "INR",
        },
      });
    }

    return NextResponse.json({ success: true, displayId });
  } catch (error) {
    console.error("❌ Payment verification failed:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
