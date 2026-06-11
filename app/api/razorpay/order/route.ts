import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { dbAdmin } from "@/libs/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * Authoritative payable amount = the order's PERSISTED total, never a
 * separate client-sent `amount`. We also sanity-check it against the order's
 * own line items + shipping − discount and refuse on a gross mismatch, so a
 * malformed/under-stated order can't be charged a different number.
 *
 * (Defence-in-depth only — Firestore rules must still stop a client from
 * writing a fake `total` onto the order doc; see the storefront rules issue.)
 */
function authoritativeTotal(order: Record<string, unknown>): number | null {
  const total = num(order.total);
  if (total <= 0) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const lineSum = items.reduce(
    (s: number, it) =>
      s +
      num((it as Record<string, unknown>).price) *
        Math.max(0, num((it as Record<string, unknown>).quantity)),
    0
  );
  const subtotal = num(order.subtotal) || lineSum;
  const expected = Math.max(0, subtotal + num(order.shipping) - num(order.discount));

  // 0.5 rupee tolerance for rounding. A larger gap means the recorded total
  // doesn't match the order contents — refuse rather than charge it.
  if (expected > 0 && Math.abs(total - expected) > 0.5) return null;
  return total;
}

export async function POST(req: Request) {
  try {
    // The client passes the Firestore order id as `receipt`. That order is the
    // source of truth for the amount — the legacy `amount` field is ignored.
    const body = await req.json().catch(() => ({}));
    const orderId =
      typeof body.receipt === "string"
        ? body.receipt
        : typeof body.orderId === "string"
        ? body.orderId
        : "";

    if (!orderId) {
      return NextResponse.json({ error: "Order id (receipt) is required" }, { status: 400 });
    }

    const orderRef = dbAdmin.collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const order = snap.data() as Record<string, unknown>;

    if (order.status === "paid") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 409 });
    }

    const amount = authoritativeTotal(order);
    if (amount == null) {
      return NextResponse.json(
        { error: "Order total is invalid or inconsistent with its items" },
        { status: 400 }
      );
    }

    const rzOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // INR → paise
      currency: "INR",
      receipt: orderId,
      payment_capture: true,
    });

    // Bind the Razorpay order to THIS order so /verify can confirm the payment
    // belongs to it (and was for the amount we authorized).
    await orderRef.update({
      razorpayOrderId: rzOrder.id,
      razorpayAmount: amount,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(rzOrder);
  } catch (error) {
    console.error("❌ Razorpay order creation failed:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
