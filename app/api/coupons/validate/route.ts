import { NextResponse } from "next/server";
import { dbAdmin } from "@/libs/firebase-admin";

type DiscountType = "percent" | "flat";
type ApplyScope = "all" | "products" | "collections" | "categories";

type ValidateItem = {
  productId: string;
  price: number;
  quantity: number;
};

type CouponDoc = {
  code?: unknown;
  title?: unknown;
  active?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
  maxDiscount?: unknown;
  minSubtotal?: unknown;
  usageLimit?: unknown;
  perUserLimit?: unknown;
  usageCount?: unknown;
  usedCount?: unknown;
  timesUsed?: unknown;
  uses?: unknown;
  startAt?: unknown;
  endAt?: unknown;
  scope?: unknown;
  productIds?: unknown;
  collectionIds?: unknown;
  categories?: unknown;
  type?: unknown;
  discount_type?: unknown;
  value?: unknown;
  amount?: unknown;
  percentOff?: unknown;
  flatOff?: unknown;
  max_discount?: unknown;
  min_subtotal?: unknown;
  applyScope?: unknown;
  apply_scope?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  startsAt?: unknown;
  expiresAt?: unknown;
  products?: unknown;
  collections?: unknown;
  categoriesText?: unknown;
  discount?: unknown;
  appliesTo?: unknown;
};

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

function asBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return Boolean(v);
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => normalize(x)).filter(Boolean);
}

function asStringList(v: unknown): string[] {
  if (Array.isArray(v)) return asStringArray(v);
  if (typeof v === "string") {
    return v
      .split(/[\n,]+/g)
      .map((x) => normalize(x))
      .filter(Boolean);
  }
  return [];
}

function asObject(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
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

function getDiscountTypeFromDoc(data: CouponDoc): DiscountType | null {
  const discountObj = asObject(data.discount);
  return (
    getDiscountType(data.discountType) ??
    getDiscountType(data.type) ??
    getDiscountType(data.discount_type) ??
    getDiscountType(discountObj?.type)
  );
}

function getDiscountValueFromDoc(data: CouponDoc): number | null {
  const discountObj = asObject(data.discount);
  return (
    asNumberOrNull(data.discountValue) ??
    asNumberOrNull(data.value) ??
    asNumberOrNull(data.amount) ??
    asNumberOrNull(data.percentOff) ??
    asNumberOrNull(data.flatOff) ??
    asNumberOrNull(discountObj?.discountValue) ??
    asNumberOrNull(discountObj?.value) ??
    asNumberOrNull(discountObj?.amount)
  );
}

function getMaxDiscountFromDoc(data: CouponDoc): number | null {
  const discountObj = asObject(data.discount);
  return (
    asNumberOrNull(data.maxDiscount) ??
    asNumberOrNull(data.max_discount) ??
    asNumberOrNull(discountObj?.maxDiscount) ??
    asNumberOrNull(discountObj?.max_discount)
  );
}

function getMinSubtotalFromDoc(data: CouponDoc): number | null {
  const discountObj = asObject(data.discount);
  return (
    asNumberOrNull(data.minSubtotal) ??
    asNumberOrNull(data.min_subtotal) ??
    asNumberOrNull(discountObj?.minSubtotal) ??
    asNumberOrNull(discountObj?.min_subtotal)
  );
}

function getUsageLimitFromDoc(data: CouponDoc): number | null {
  return asNumberOrNull(data.usageLimit);
}

function getPerUserLimitFromDoc(data: CouponDoc): number | null {
  const discountObj = asObject(data.discount);
  return asNumberOrNull(data.perUserLimit) ?? asNumberOrNull(discountObj?.perUserLimit);
}

function getStartAtMsFromDoc(data: CouponDoc): number | null {
  return asTimestampMs(data.startAt) ?? asTimestampMs(data.startsAt) ?? asTimestampMs(data.startDate);
}

function getEndAtMsFromDoc(data: CouponDoc): number | null {
  return asTimestampMs(data.endAt) ?? asTimestampMs(data.expiresAt) ?? asTimestampMs(data.endDate);
}

function getScopeFromDoc(data: CouponDoc): ApplyScope {
  const appliesToObj = asObject(data.appliesTo);
  return (
    getScope(data.scope) ??
    getScope(data.applyScope) ??
    getScope(data.apply_scope) ??
    getScope(appliesToObj?.scope) ??
    "all"
  );
}

function getProductIdsFromDoc(data: CouponDoc): string[] {
  const appliesToObj = asObject(data.appliesTo);
  return asStringList(data.productIds)
    .concat(asStringList(data.products))
    .concat(asStringList(appliesToObj?.productIds))
    .concat(asStringList(appliesToObj?.products));
}

function getCollectionIdsFromDoc(data: CouponDoc): string[] {
  const appliesToObj = asObject(data.appliesTo);
  return asStringList(data.collectionIds)
    .concat(asStringList(data.collections))
    .concat(asStringList(appliesToObj?.collectionIds))
    .concat(asStringList(appliesToObj?.collections));
}

function getCategoriesFromDoc(data: CouponDoc): string[] {
  const appliesToObj = asObject(data.appliesTo);
  return asStringList(data.categories)
    .concat(asStringList(data.categoriesText))
    .concat(asStringList(appliesToObj?.categories))
    .concat(asStringList(appliesToObj?.categoriesText));
}

function buildTermsText(args: {
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minSubtotal: number | null;
  startAtMs: number | null;
  endAtMs: number | null;
  scope: ApplyScope;
}) {
  const parts: string[] = [];
  parts.push(
    args.discountType === "percent"
      ? `${args.discountValue}% off`
      : `₹${Math.round(args.discountValue).toLocaleString("en-IN")} off`
  );
  if (typeof args.maxDiscount === "number" && args.maxDiscount > 0) {
    parts.push(`Max discount ₹${Math.round(args.maxDiscount).toLocaleString("en-IN")}`);
  }
  if (typeof args.minSubtotal === "number" && args.minSubtotal > 0) {
    parts.push(`Min order ₹${Math.round(args.minSubtotal).toLocaleString("en-IN")}`);
  }
  if (args.startAtMs) {
    const d = new Date(args.startAtMs);
    parts.push(`Starts ${d.toLocaleDateString("en-IN")}`);
  }
  if (args.endAtMs) {
    const d = new Date(args.endAtMs);
    parts.push(`Ends ${d.toLocaleDateString("en-IN")}`);
  }
  if (args.scope === "all") parts.push("Applicable on all products");
  if (args.scope === "products") parts.push("Applicable on selected products");
  if (args.scope === "collections") parts.push("Applicable on selected collections");
  if (args.scope === "categories") parts.push("Applicable on selected categories");
  return parts.join(" • ");
}

function getCouponUsageCount(data: CouponDoc): number | null {
  return (
    asNumberOrNull(data.usageCount) ??
    asNumberOrNull(data.usedCount) ??
    asNumberOrNull(data.timesUsed) ??
    asNumberOrNull(data.uses)
  );
}

function getStringField(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (!(key in obj)) return null;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      code?: unknown;
      items?: unknown;
      subtotal?: unknown;
      userId?: unknown;
    };

    const codeRaw = normalize(body.code);
    const code = normalizeCode(codeRaw);
    if (!code) {
      return NextResponse.json({ ok: false, error: "Enter a coupon code." }, { status: 400 });
    }

    const itemsRaw = Array.isArray(body.items) ? (body.items as unknown[]) : [];
    const items: ValidateItem[] = itemsRaw
      .map((i) => {
        const obj = i as Record<string, unknown>;
        return {
          productId: normalize(obj.productId),
          price: asNumberOrNull(obj.price) ?? 0,
          quantity: asNumberOrNull(obj.quantity) ?? 0,
        };
      })
      .filter((i) => i.productId && i.price >= 0 && i.quantity > 0);

    const subtotal = asNumberOrNull(body.subtotal) ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
    const userId = asStringOrNull(body.userId);

    const byId = await dbAdmin.collection("coupons").doc(code).get();
    const snap = byId.exists
      ? byId
      : await dbAdmin.collection("coupons").where("code", "==", code).limit(1).get().then((q) => q.docs[0] ?? null);

    if (!snap) {
      return NextResponse.json({ ok: false, error: "Invalid coupon code." }, { status: 404 });
    }

    const data = (snap.data() ?? {}) as CouponDoc;
    const active = asBoolean(data.active);
    if (!active) {
      return NextResponse.json({ ok: false, error: "This coupon is not active." }, { status: 400 });
    }

    const discountType = getDiscountTypeFromDoc(data);
    const discountValue = getDiscountValueFromDoc(data);
    const scope = getScopeFromDoc(data);

    if (!discountType || typeof discountValue !== "number" || discountValue <= 0) {
      return NextResponse.json({ ok: false, error: "Coupon is misconfigured." }, { status: 400 });
    }

    const maxDiscount = getMaxDiscountFromDoc(data);
    const minSubtotal = getMinSubtotalFromDoc(data);
    const usageLimit = getUsageLimitFromDoc(data);
    const perUserLimit = getPerUserLimitFromDoc(data);

    const startAtMs = getStartAtMsFromDoc(data);
    const endAtMs = getEndAtMsFromDoc(data);
    const now = Date.now();
    if (startAtMs && now < startAtMs) {
      return NextResponse.json({ ok: false, error: "This coupon is not active yet." }, { status: 400 });
    }
    if (endAtMs && now > endAtMs) {
      return NextResponse.json({ ok: false, error: "This coupon has expired." }, { status: 400 });
    }

    if (typeof minSubtotal === "number" && minSubtotal > 0 && subtotal < minSubtotal) {
      return NextResponse.json(
        { ok: false, error: `Add ₹${Math.max(0, minSubtotal - subtotal).toLocaleString("en-IN")} more to use this coupon.` },
        { status: 400 }
      );
    }

    if (typeof usageLimit === "number" && usageLimit > 0) {
      const fromDoc = getCouponUsageCount(data);
      if (typeof fromDoc === "number" && fromDoc >= usageLimit) {
        return NextResponse.json({ ok: false, error: "This coupon has reached its usage limit." }, { status: 400 });
      }

      if (fromDoc == null) {
        const ordersSnap = await dbAdmin
          .collection("orders")
          .where("coupon.code", "==", code)
          .select("status")
          .get();
        const used = ordersSnap.docs.reduce((count, d) => {
          const status = getStringField(d.data(), "status");
          if (status === "failed" || status === "cancelled") return count;
          return count + 1;
        }, 0);
        if (used >= usageLimit) {
          return NextResponse.json({ ok: false, error: "This coupon has reached its usage limit." }, { status: 400 });
        }
      }
    }

    if (typeof perUserLimit === "number" && perUserLimit > 0) {
      if (!userId) {
        return NextResponse.json({ ok: false, error: "Please sign in to use this coupon." }, { status: 400 });
      }

      const ordersSnap = await dbAdmin
        .collection("orders")
        .where("userId", "==", userId)
        .select("status", "coupon")
        .limit(500)
        .get();

      const used = ordersSnap.docs.reduce((count, d) => {
        const data = d.data();
        const status = getStringField(data, "status");
        if (status === "failed" || status === "cancelled") return count;
        const couponObj = typeof data.coupon === "object" && data.coupon ? (data.coupon as Record<string, unknown>) : null;
        const usedCode = couponObj ? getStringField(couponObj, "code") : null;
        return usedCode === code ? count + 1 : count;
      }, 0);

      if (used >= perUserLimit) {
        return NextResponse.json({ ok: false, error: "You have already used this coupon." }, { status: 400 });
      }
    }

    const productIds = getProductIdsFromDoc(data);
    const collectionIds = getCollectionIdsFromDoc(data);
    const categories = getCategoriesFromDoc(data);

    const uniqueProductIds = Array.from(new Set(items.map((i) => i.productId))).filter(Boolean);
    const productSnaps = await Promise.all(
      uniqueProductIds.map(async (pid) => {
        const s = await dbAdmin.collection("products").doc(pid).get().catch(() => null);
        return [pid, s?.exists ? (s.data() as Record<string, unknown>) : null] as const;
      })
    );

    const productMeta = new Map<
      string,
      { categories: string[]; collectionId: string | null }
    >();
    productSnaps.forEach(([pid, d]) => {
      const catRaw = d && Array.isArray(d.categories) ? d.categories : [];
      const cat = (catRaw as unknown[]).map((x) => normalize(x)).filter(Boolean);
      const collectionId = d ? asStringOrNull(d["collectionId"]) : null;
      productMeta.set(pid, { categories: cat, collectionId });
    });

    const categoriesSet = new Set(categories.map((c) => c.toLowerCase()));
    const productIdsSet = new Set(productIds);
    const collectionIdsSet = new Set(collectionIds);

    const eligibleSubtotal = items.reduce((sum, i) => {
      const meta = productMeta.get(i.productId);
      const eligible = (() => {
        if (scope === "all") return true;
        if (scope === "products") return productIdsSet.has(i.productId);
        if (scope === "collections") return meta?.collectionId ? collectionIdsSet.has(meta.collectionId) : false;
        if (scope === "categories") {
          const cats = meta?.categories ?? [];
          return cats.some((c) => categoriesSet.has(c.toLowerCase()));
        }
        return false;
      })();
      return eligible ? sum + i.price * i.quantity : sum;
    }, 0);

    if (eligibleSubtotal <= 0) {
      return NextResponse.json({ ok: false, error: "This coupon is not applicable to your cart." }, { status: 400 });
    }

    let discountAmount = 0;
    if (discountType === "percent") {
      discountAmount = Math.round((eligibleSubtotal * discountValue) / 100);
    } else {
      discountAmount = Math.min(Math.round(discountValue), eligibleSubtotal);
    }
    if (typeof maxDiscount === "number" && maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, Math.round(maxDiscount));
    }
    discountAmount = Math.max(0, Math.round(discountAmount));

    const termsText = buildTermsText({
      discountType,
      discountValue,
      maxDiscount,
      minSubtotal,
      startAtMs,
      endAtMs,
      scope,
    });

    const coupon = {
      id: snap.id,
      code: normalizeCode(asStringOrNull(data.code) ?? snap.id),
      title: asStringOrNull(data.title) ?? null,
      active: true,
      discountType,
      discountValue,
      maxDiscount,
      minSubtotal,
      usageLimit,
      perUserLimit,
      startAtMs,
      endAtMs,
      scope,
      productIds,
      collectionIds,
      categories,
      termsText,
    };

    return NextResponse.json({
      ok: true,
      coupon,
      discountAmount,
      eligibleSubtotal,
      userId: userId ?? null,
    });
  } catch (error) {
    console.error("Coupon validate failed:", error);
    return NextResponse.json({ ok: false, error: "Unable to validate coupon." }, { status: 500 });
  }
}
