"use client";

import posthog from "posthog-js";
import { trackFromPosthog } from "@/libs/fpixel";
import { useAppConfigStore } from "@/store/useAppStore";

export type AnalyticsProps = Record<string, unknown>;

function enabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

function trackingAllowed() {
  const { configLoaded, testMode } = useAppConfigStore.getState();
  return configLoaded && !testMode;
}

export function track(event: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;
  if (!trackingAllowed()) return;
  if (enabled()) {
    posthog.capture(event, props);
  }
  trackFromPosthog(event, props);
}
