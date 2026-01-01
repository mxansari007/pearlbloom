"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DiscountType = "percent" | "flat";
export type ApplyScope = "all" | "products" | "collections" | "categories";

export type CouponPublic = {
  id: string;
  code: string;
  title: string | null;
  active: true;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minSubtotal: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  startAtMs: number | null;
  endAtMs: number | null;
  scope: ApplyScope;
  productIds: string[];
  collectionIds: string[];
  categories: string[];
  termsText: string;
};

export type CouponItemInput = {
  productId: string;
  price: number;
  quantity: number;
};

type ApplyResult =
  | { ok: true; coupon: CouponPublic; discountAmount: number; eligibleSubtotal: number }
  | { ok: false; error: string };

type CouponState = {
  appliedCode: string;
  status: "idle" | "applying" | "applied" | "error";
  error: string | null;
  coupon: CouponPublic | null;
  discountAmount: number;
  eligibleSubtotal: number;

  setAppliedCode: (code: string) => void;
  clear: () => void;
  apply: (args: { code: string; items: CouponItemInput[]; subtotal: number; userId?: string | null }) => Promise<ApplyResult>;
  revalidate: (args: { items: CouponItemInput[]; subtotal: number; userId?: string | null }) => Promise<ApplyResult>;
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

export const useCouponStore = create<CouponState>()(
  persist(
    (set, get) => ({
      appliedCode: "",
      status: "idle",
      error: null,
      coupon: null,
      discountAmount: 0,
      eligibleSubtotal: 0,

      setAppliedCode: (code) => set({ appliedCode: normalizeCode(code) }),

      clear: () =>
        set({
          appliedCode: "",
          status: "idle",
          error: null,
          coupon: null,
          discountAmount: 0,
          eligibleSubtotal: 0,
        }),

      apply: async ({ code, items, subtotal, userId }) => {
        const normalized = normalizeCode(code);
        if (!normalized) {
          set({ status: "error", error: "Enter a coupon code." });
          return { ok: false, error: "Enter a coupon code." };
        }

        set({ status: "applying", error: null, appliedCode: normalized });

        const resp = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: normalized, items, subtotal, userId: userId ?? null }),
        });

        const json: unknown = await resp.json().catch(() => ({}));
        const obj = typeof json === "object" && json !== null ? (json as Record<string, unknown>) : {};
        if (!resp.ok || obj.ok !== true) {
          const error = typeof obj.error === "string" ? obj.error : "Invalid coupon code.";
          set({ status: "error", error, coupon: null, discountAmount: 0, eligibleSubtotal: 0 });
          return { ok: false, error };
        }

        const coupon = obj.coupon as CouponPublic;
        const discountAmount = typeof obj.discountAmount === "number" ? obj.discountAmount : 0;
        const eligibleSubtotal = typeof obj.eligibleSubtotal === "number" ? obj.eligibleSubtotal : 0;

        set({
          status: "applied",
          error: null,
          coupon,
          discountAmount,
          eligibleSubtotal,
          appliedCode: typeof coupon?.code === "string" ? coupon.code : normalized,
        });

        return { ok: true, coupon, discountAmount, eligibleSubtotal };
      },

      revalidate: async ({ items, subtotal, userId }) => {
        const { appliedCode } = get();
        if (!appliedCode) {
          return { ok: false, error: "No coupon applied." };
        }
        return get().apply({ code: appliedCode, items, subtotal, userId });
      },
    }),
    {
      name: "pearlbloom-coupon",
      partialize: (state) => ({
        appliedCode: state.appliedCode,
      }),
    }
  )
);
