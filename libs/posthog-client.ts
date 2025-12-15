// src/libs/posthog-client.ts
"use client";

import posthog from "posthog-js";

let initialized = false;

export function getPosthog() {
  if (typeof window === "undefined") return null;

  if (!initialized) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) {
      console.warn("PostHog key not set (NEXT_PUBLIC_POSTHOG_KEY).");
      return null;
    }

    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      capture_pageview: false, // we fire our own events when needed
    });

    initialized = true;
  }

  return posthog;
}
