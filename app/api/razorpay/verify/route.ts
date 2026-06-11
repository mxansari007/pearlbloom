import crypto from "crypto";
import { NextResponse } from "next/server";
import { dbAdmin } from "@/libs/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
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

let cachedTestMode: boolean | null = null;
let cachedTestModeFetchedAt = 0;

async function getTestMode(): Promise<boolean> {
  const now = Date.now();
  if (cachedTestMode !== null && now - cachedTestModeFetchedAt < 30_000) {
    return cachedTestMode;
  }

  const snap = await dbAdmin.collection("siteSettings").doc("main").get();
  const raw = snap.exists ? snap.get("testMode") : undefined;
  cachedTestMode = typeof raw === "boolean" ? raw : false;
  cachedTestModeFetchedAt = now;
  return cachedTestMode;
}

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

    // Load the order and bind the payment to it. The signature alone proves a
    // valid Razorpay payment exists, but NOT that it belongs to this order —
    // so we require razorpay_order_id to match the one /order stored on this
    // doc. Without this check a valid signature for a cheaper order could be
    // replayed to mark a different order paid.
    const orderRef = dbAdmin.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    const orderData = orderSnap.data() as Record<string, unknown>;
    const displayId = getStringField(orderData, "displayId");

    const boundRazorpayOrderId = getStringField(orderData, "razorpayOrderId");
    if (boundRazorpayOrderId && boundRazorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: "Payment does not match this order" },
        { status: 400 }
      );
    }

    // Idempotent: a re-submitted callback (double-click, retry) for an
    // already-paid order is a no-op success.
    if (getStringField(orderData, "status") === "paid") {
      return NextResponse.json({ success: true, displayId });
    }

    await orderRef.update({
      status: "paid",
      payment: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    const distinctId = orderData ? getStringField(orderData, "userId") : null;
    const testMode = await getTestMode();
    if (posthog && distinctId && !testMode) {
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
