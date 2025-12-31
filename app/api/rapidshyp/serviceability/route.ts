import { NextResponse } from "next/server";

const RAPIDSHYP_SERVICEABILITY_URL =
  "https://api.rapidshyp.com/rapidshyp/apis/v1/serviceabilty_check";

function normalizeDeliveryPincode(value: unknown) {
  const raw = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
  const pincode = raw.replace(/\D/g, "").slice(0, 6);
  return pincode.length === 6 ? pincode : null;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RAPIDSHYP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing RAPIDSHYP_API_KEY" }, { status: 500 });
    }

    const body = (await req.json()) as {
      deliveryPincode?: unknown;
      totalOrderValue?: unknown;
      weight?: unknown;
      cod?: unknown;
    };

    const deliveryPincode = normalizeDeliveryPincode(body.deliveryPincode);
    if (!deliveryPincode) {
      return NextResponse.json({ error: "Invalid delivery pincode" }, { status: 400 });
    }

    const pickupPincode = normalizeDeliveryPincode(process.env.RAPIDSHYP_PICKUP_PINCODE) ?? "110068";
    const totalOrderValue =
      typeof body.totalOrderValue === "number"
        ? body.totalOrderValue
        : typeof body.totalOrderValue === "string"
          ? Number(body.totalOrderValue)
          : 0;
    const weight =
      typeof body.weight === "number" ? body.weight : typeof body.weight === "string" ? Number(body.weight) : 1;
    const cod = typeof body.cod === "boolean" ? body.cod : true;

    const upstream = await fetch(RAPIDSHYP_SERVICEABILITY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "rapidshyp-token": apiKey,
      },
      body: JSON.stringify({
        Pickup_pincode: pickupPincode,
        Delivery_pincode: deliveryPincode,
        cod,
        total_order_value: Number.isFinite(totalOrderValue) ? Math.max(1, Math.round(totalOrderValue)) : 1,
        weight: Number.isFinite(weight) ? weight : 1,
      }),
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {}

    const dataObj = (data && typeof data === "object" ? (data as Record<string, unknown>) : null);
    const remark =
      typeof dataObj?.remark === "string"
        ? dataObj.remark
        : typeof dataObj?.message === "string"
          ? dataObj.message
          : null;
    const upstreamStatusFlag = typeof dataObj?.status === "boolean" ? dataObj.status : null;
    const courierList = Array.isArray(dataObj?.serviceable_courier_list)
      ? (dataObj?.serviceable_courier_list as unknown[])
      : null;

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: remark || "Rapidshyp request failed",
          status: upstream.status,
          data,
        },
        { status: 502 }
      );
    }

    if (upstreamStatusFlag === false) {
      return NextResponse.json(
        {
          error: remark || "Rapidshyp request failed",
          status: upstream.status,
          data,
        },
        { status: 502 }
      );
    }

    const serviceable = courierList ? courierList.length > 0 : null;
    return NextResponse.json({ serviceable, message: remark, data });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
