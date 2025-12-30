"use client";

import posthog from "posthog-js";

export type AnalyticsProps = Record<string, unknown>;

function enabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function track(event: string, props?: AnalyticsProps) {
  if (!enabled()) return;
  if (typeof window === "undefined") return;
  posthog.capture(event, props);
}

