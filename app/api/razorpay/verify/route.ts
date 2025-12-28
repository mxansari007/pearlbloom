import crypto from "crypto";
import { NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { dbClient } from "@/libs/firebase-client";

export async function POST(req: Request) {
  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = await req.json();

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  // ✅ Payment verified → mark order paid
  await updateDoc(doc(dbClient, "orders", orderId), {
    status: "paid",
    payment: {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    },
    updatedAt: Date.now(),
  });

  return NextResponse.json({ success: true });
}
