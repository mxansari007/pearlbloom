import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  const { amount, receipt } = await req.json();

  const order = await razorpay.orders.create({
    amount: amount * 100, // INR → paise
    currency: "INR",
    receipt,
    payment_capture: 1,
  });

  return NextResponse.json(order);
}
