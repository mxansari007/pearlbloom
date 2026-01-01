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
};

interface AppConfigState {
  configLoaded: boolean;
  testMode: boolean;
  lastFetchedAt: number | null;
  loadConfig: () => Promise<void>;
}

export const useAppConfigStore = create<AppConfigState>()(
  persist(
    (set) => ({
      configLoaded: false,
      testMode: false,
      lastFetchedAt: null,
      loadConfig: async () => {
        try {
          const ref = doc(dbClient, "siteSettings", "main");
          const snap = await getDoc(ref);
          const data = snap.exists() ? (snap.data() as SiteSettingsRuntimeConfig) : null;
          const testMode = typeof data?.testMode === "boolean" ? data.testMode : false;
          set({ configLoaded: true, testMode, lastFetchedAt: Date.now() });
        } catch {
          set({ configLoaded: true, testMode: false, lastFetchedAt: Date.now() });
        }
      },
    }),
    {
      name: "pearlbloom-app-config",
      partialize: (state) => ({
        testMode: state.testMode,
        lastFetchedAt: state.lastFetchedAt,
      }),
    }
  )
);
