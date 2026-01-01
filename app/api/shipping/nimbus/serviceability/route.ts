import { NextResponse } from "next/server";

export const runtime = "nodejs";

type NimbusLoginResponse = {
  status?: boolean;
  data?: string;
  message?: string;
  error?: string;
};

type NimbusServiceabilityResponse = {
  status?: boolean;
  data?: unknown;
  message?: string;
  error?: string;
};

let cachedToken: string | null = null;

function cleanToken(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^`|`$/g, "")
    .replace(/^Bearer\s+/i, "");
}

async function loginAndGetToken() {
  const email = String(process.env.NIMBUSPOST_EMAIL || "").trim();
  const password = String(process.env.NIMBUSPOST_PASSWORD || "").trim();

  if (!email || !password) {
    throw new Error("Nimbus Post credentials are not configured.");
  }

  const resp = await fetch("https://api.nimbuspost.com/v1/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const json = (await resp.json().catch(() => ({}))) as NimbusLoginResponse;
  if (!resp.ok) {
    const msg =
      typeof json?.message === "string"
        ? json.message
        : typeof json?.error === "string"
          ? json.error
          : undefined;
    throw new Error(msg || `Nimbus login failed (${resp.status})`);
  }

  const token = cleanToken(json?.data);
  if (!token) {
    throw new Error("Nimbus login did not return a token.");
  }

  cachedToken = token;
  return token;
}

async function getToken() {
  if (cachedToken) return cachedToken;
  return loginAndGetToken();
}

async function callServiceability(token: string, payload: Record<string, unknown>) {
  const resp = await fetch("https://api.nimbuspost.com/v1/courier/serviceability", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const json = (await resp.json().catch(() => ({}))) as NimbusServiceabilityResponse;
  return { resp, json };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const destination = (url.searchParams.get("pincode") || "").trim();

  if (!/^\d{6}$/.test(destination)) {
    return NextResponse.json({ error: "pincode must be a 6-digit string" }, { status: 400 });
  }

  const origin = String(process.env.NIMBUSPOST_ORIGIN_PINCODE || "").trim();
  if (!/^\d{6}$/.test(origin)) {
    return NextResponse.json(
      { error: "Nimbus Post origin pincode is not configured." },
      { status: 500 }
    );
  }

  const payload = {
    origin,
    destination,
    payment_type: "prepaid",
  };

  try {
    const token = await getToken();
    let { resp, json } = await callServiceability(token, payload);

    if (resp.status === 401 || resp.status === 403) {
      cachedToken = null;
      const nextToken = await loginAndGetToken();
      ({ resp, json } = await callServiceability(nextToken, payload));
    }

    if (!resp.ok) {
      const msg =
        typeof json?.message === "string"
          ? json.message
          : typeof json?.error === "string"
            ? json.error
            : undefined;
      return NextResponse.json(
        { error: msg || `Nimbus request failed (${resp.status})` },
        { status: resp.status }
      );
    }

    const data = typeof json === "object" && json !== null ? (json as Record<string, unknown>)["data"] : null;
    const couriers = Array.isArray(data) ? data : [];
    return NextResponse.json({
      pincode: destination,
      origin,
      serviceable: couriers.length > 0,
      couriers,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : null;
    return NextResponse.json({ error: msg || "Serviceability check failed" }, { status: 500 });
  }
}
