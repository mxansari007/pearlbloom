"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { doc, getDoc } from "firebase/firestore";
import { dbClient } from "../libs/firebase-client";
import type { AppUser } from "../types/user";

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  authInitialized: boolean; // ✅ NEW

  setUser: (user: AppUser) => void;
  clearUser: () => void;
  setAuthInitialized: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authInitialized: false, // ✅ default false

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
          authInitialized: true,
        }),

      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
          authInitialized: true,
        }),

      setAuthInitialized: () =>
        set({
          authInitialized: true,
        }),
    }),
    {
      name: "pearlbloom-auth",

      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),

      // 🔑 THIS IS THE MOST IMPORTANT PART
      onRehydrateStorage: () => (state) => {
        state?.setAuthInitialized();
      },
    }
  )
);

type SiteSettingsRuntimeConfig = {
  testMode?: boolean;
  shippingRate?: number | string;
  freeShippingAbove?: number | string;
  giftSleevePrice?: number | string;
  codEnabled?: boolean;
  returnDays?: number | string;
  exchangeDays?: number | string;
  ugcImages?: unknown;
  instagramUrl?: string;
};

interface AppConfigState {
  configLoaded: boolean;
  testMode: boolean;
  shippingRate: number;
  freeShippingAbove: number | null;
  // PDP trust + gifting + UGC config — all optional, gated on real values.
  giftSleevePrice: number | null;
  codEnabled: boolean;
  returnDays: number | null;
  exchangeDays: number | null;
  ugcImages: string[];
  instagramUrl: string | null;
  whatsappNumber: string | null;
  lastFetchedAt: number | null;
  loadConfig: () => Promise<void>;
}

export const useAppConfigStore = create<AppConfigState>()(
  persist(
    (set) => ({
      configLoaded: false,
      testMode: false,
      shippingRate: 0,
      freeShippingAbove: null,
      giftSleevePrice: null,
      codEnabled: false,
      returnDays: null,
      exchangeDays: null,
      ugcImages: [],
      instagramUrl: null,
      whatsappNumber: null,
      lastFetchedAt: null,
      loadConfig: async () => {
        try {
          const ref = doc(dbClient, "siteSettings", "main");
          const snap = await getDoc(ref);
          const data = snap.exists() ? (snap.data() as SiteSettingsRuntimeConfig) : null;
          const asNumberOrNull = (value: unknown): number | null => {
            if (typeof value === "number" && Number.isFinite(value)) return value;
            if (typeof value === "string") {
              const n = Number(value);
              return Number.isFinite(n) ? n : null;
            }
            return null;
          };
          const asStringArray = (value: unknown): string[] =>
            Array.isArray(value)
              ? value.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
              : [];
          const testMode = typeof data?.testMode === "boolean" ? data.testMode : false;
          const shippingRate =
            asNumberOrNull(data?.shippingRate) ??
            asNumberOrNull((data as unknown as { globalShippingRate?: unknown })?.globalShippingRate) ??
            asNumberOrNull((data as unknown as { shippingRateInr?: unknown })?.shippingRateInr) ??
            asNumberOrNull((data as unknown as { shipping?: unknown })?.shipping) ??
            asNumberOrNull((data as unknown as { shipping?: { rate?: unknown } })?.shipping?.rate) ??
            asNumberOrNull((data as unknown as { shipping?: { shippingRate?: unknown } })?.shipping?.shippingRate) ??
            0;
          const freeShippingAbove =
            asNumberOrNull(data?.freeShippingAbove) ??
            asNumberOrNull((data as unknown as { free_shipping_above?: unknown })?.free_shipping_above) ??
            asNumberOrNull((data as unknown as { freeShippingThreshold?: unknown })?.freeShippingThreshold) ??
            asNumberOrNull((data as unknown as { shipping?: { freeAbove?: unknown } })?.shipping?.freeAbove);

          // Extract WhatsApp number from nested siteSettings structure
          const raw = data as unknown as Record<string, unknown>;
          const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
          const asStr = (v: unknown): string | null => typeof v === "string" && v.trim() ? v.trim() : null;
          const footer = isObj(raw?.footer) ? raw.footer : null;
          const business = isObj(raw?.business) ? raw.business : null;
          const businessSocials = isObj(business?.socials) ? business.socials : null;
          const footerSocialLinks = Array.isArray(footer?.socialLinks) ? footer.socialLinks : [];
          const footerWhatsApp = footerSocialLinks
            .map((x: unknown) => isObj(x) ? { platform: asStr(x.platform), url: asStr(x.url) } : null)
            .filter((x): x is { platform: string; url: string } => Boolean(x?.platform && x?.url))
            .find((x) => x.platform === "whatsapp")?.url ?? null;
          const whatsappNumber =
            asStr(businessSocials?.whatsapp) ??
            asStr(business?.whatsapp) ??
            asStr(business?.whatsappNumber) ??
            footerWhatsApp ??
            asStr(footer?.contactPhone) ??
            null;

          set({
            configLoaded: true,
            testMode,
            shippingRate,
            freeShippingAbove,
            giftSleevePrice: asNumberOrNull(data?.giftSleevePrice),
            codEnabled: data?.codEnabled === true,
            returnDays: asNumberOrNull(data?.returnDays),
            exchangeDays: asNumberOrNull(data?.exchangeDays),
            ugcImages: asStringArray(data?.ugcImages),
            instagramUrl: typeof data?.instagramUrl === "string" ? data.instagramUrl : null,
            whatsappNumber,
            lastFetchedAt: Date.now(),
          });
        } catch {
          set({
            configLoaded: true,
            testMode: false,
            shippingRate: 0,
            freeShippingAbove: null,
            giftSleevePrice: null,
            codEnabled: false,
            returnDays: null,
            exchangeDays: null,
            ugcImages: [],
            instagramUrl: null,
            whatsappNumber: null,
            lastFetchedAt: Date.now(),
          });
        }
      },
    }),
    {
      name: "pearlbloom-app-config",
      partialize: (state) => ({
        testMode: state.testMode,
        shippingRate: state.shippingRate,
        freeShippingAbove: state.freeShippingAbove,
        giftSleevePrice: state.giftSleevePrice,
        codEnabled: state.codEnabled,
        returnDays: state.returnDays,
        exchangeDays: state.exchangeDays,
        ugcImages: state.ugcImages,
        instagramUrl: state.instagramUrl,
        whatsappNumber: state.whatsappNumber,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
