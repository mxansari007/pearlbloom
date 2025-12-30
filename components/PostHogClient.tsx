"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAppStore";

let initialized = false;

export default function PostHogClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    if (initialized) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
    });
    initialized = true;
  }, []);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    const url =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    if (isAuthenticated && user?.uid) {
      posthog.identify(user.uid, { role: user.role });
    } else {
      posthog.reset();
    }
  }, [isAuthenticated, user?.uid, user?.role]);

  return null;
}
