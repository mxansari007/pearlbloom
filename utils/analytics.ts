"use client";

import posthog from "posthog-js";
import { trackFromPosthog } from "@/libs/fpixel";

export type AnalyticsProps = Record<string, unknown>;

function enabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function track(event: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;
  if (enabled()) {
    posthog.capture(event, props);
  }
  trackFromPosthog(event, props);
}
