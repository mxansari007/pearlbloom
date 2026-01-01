import { NextResponse } from "next/server";
import { dbAdmin } from "@/libs/firebase-admin";

type DiscountType = "percent" | "flat";
type ApplyScope = "all" | "products" | "collections" | "categories";

function normalize(v: unknown) {
  return String(v ?? "").trim();
}

function normalizeCode(value: string) {
  const upper = normalize(value).toUpperCase();
  return upper
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

function asNumberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asStringOrNull(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asTimestampMs(v: unknown): number | null {
  if (!v) return null;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    if (typeof obj.toDate === "function") {
      const d = (obj.toDate as () => unknown)();
      if (d instanceof Date && !Number.isNaN(d.getTime())) return d.getTime();
    }
  }
  const s = asStringOrNull(v);
  if (s) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  const n = asNumberOrNull(v);
  if (typeof n === "number") return n;
  return null;
}

function asObject(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function getDiscountType(v: unknown): DiscountType | null {
  if (v === "percent" || v === "flat") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "percent" || s === "percentage" || s === "percent(%)" || s === "percent (%)") return "percent";
    if (s === "flat" || s === "fixed" || s === "amount") return "flat";
  }
  return null;
}

function getScope(v: unknown): ApplyScope | null {
  if (v === "all" || v === "products" || v === "collections" || v === "categories") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "all") return "all";
    if (s === "product" || s === "products") return "products";
    if (s === "collection" || s === "collections") return "collections";
    if (s === "category" || s === "categories") return "categories";
  }
  return null;
}

export async function GET() {
  try {
    const now = Date.now();
    const snap = await dbAdmin
      .collection("coupons")
      .where("active", "==", true)
      .limit(12)
      .get();

    const coupons = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as Record<string, unknown> & { id: string })
      .map((data) => {
        const discountObj = asObject(data["discount"]);
        const appliesToObj = asObject(data["appliesTo"]);

        const discountType =
          getDiscountType(data["discountType"]) ??
          getDiscountType(data["type"]) ??
          getDiscountType(data["discount_type"]) ??
          getDiscountType(discountObj?.["type"]);

        const discountValue =
          asNumberOrNull(data["discountValue"]) ??
          asNumberOrNull(data["value"]) ??
          asNumberOrNull(data["amount"]) ??
          asNumberOrNull(data["percentOff"]) ??
          asNumberOrNull(data["flatOff"]) ??
          asNumberOrNull(discountObj?.["discountValue"]) ??
          asNumberOrNull(discountObj?.["value"]) ??
          asNumberOrNull(discountObj?.["amount"]);

        const startAtMs = asTimestampMs(data["startAt"]) ?? asTimestampMs(data["startsAt"]) ?? asTimestampMs(data["startDate"]);
        const endAtMs = asTimestampMs(data["endAt"]) ?? asTimestampMs(data["expiresAt"]) ?? asTimestampMs(data["endDate"]);
        if (!discountType || typeof discountValue !== "number" || discountValue <= 0) return null;
        if (startAtMs && now < startAtMs) return null;
        if (endAtMs && now > endAtMs) return null;

        const code = normalizeCode(asStringOrNull(data["code"]) ?? data.id);
        if (!code) return null;

        return {
          id: data.id,
          code,
          title: asStringOrNull(data["title"]) ?? null,
          discountType,
          discountValue,
          maxDiscount:
            asNumberOrNull(data["maxDiscount"]) ??
            asNumberOrNull(data["max_discount"]) ??
            asNumberOrNull(discountObj?.["maxDiscount"]) ??
            asNumberOrNull(discountObj?.["max_discount"]),
          minSubtotal:
            asNumberOrNull(data["minSubtotal"]) ??
            asNumberOrNull(data["min_subtotal"]) ??
            asNumberOrNull(discountObj?.["minSubtotal"]) ??
            asNumberOrNull(discountObj?.["min_subtotal"]),
          usageLimit: asNumberOrNull(data["usageLimit"]),
          perUserLimit: asNumberOrNull(data["perUserLimit"]) ?? asNumberOrNull(discountObj?.["perUserLimit"]),
          startAtMs,
          endAtMs,
          scope:
            getScope(data["scope"]) ??
            getScope(data["applyScope"]) ??
            getScope(data["apply_scope"]) ??
            getScope(appliesToObj?.["scope"]) ??
            "all",
        };
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .slice(0, 6);

    return NextResponse.json({ ok: true, coupons });
  } catch (error) {
    console.error("Coupons active failed:", error);
    return NextResponse.json({ ok: false, coupons: [] }, { status: 500 });
  }
}
