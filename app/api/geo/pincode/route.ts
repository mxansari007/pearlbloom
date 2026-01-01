import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PostalPincodeResponseItem = {
  Status?: string;
  Message?: string;
  PostOffice?: Array<{
    Name?: string;
    District?: string;
    State?: string;
    Country?: string;
  }> | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pincode = (url.searchParams.get("pincode") || "").trim();

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "pincode must be a 6-digit string" }, { status: 400 });
  }

  const resp = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
    cache: "no-store",
  });

  if (!resp.ok) {
    return NextResponse.json({ error: "Failed to validate pincode" }, { status: 502 });
  }

  const json = (await resp.json().catch(() => null)) as PostalPincodeResponseItem[] | null;
  const first = Array.isArray(json) ? json[0] : null;
  const offices = first?.PostOffice && Array.isArray(first.PostOffice) ? first.PostOffice : [];
  const status = String(first?.Status || "");

  if (status.toLowerCase() !== "success" || offices.length === 0) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  const office = offices[0] || {};
  const city = String(office.District || office.Name || "").trim();
  const state = String(office.State || "").trim();
  const country = String(office.Country || "India").trim();

  if (!city || !state) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    pincode,
    city,
    state,
    country,
  });
}

