// src/components/HomeAnalyticsTracker.tsx
"use client";

import { useEffect } from "react";
import { getPosthog } from "../libs/posthog-client";

export default function HomeAnalyticsTracker() {
  useEffect(() => {
    const ph = getPosthog();
    if (!ph) return;

    ph.capture("view_homepage", {
      // you can add more context later if needed
      page: "home",
    });
  }, []);

  return null;
}
