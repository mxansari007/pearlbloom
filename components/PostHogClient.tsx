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
  const authInitialized = useAuthStore((s) => s.authInitialized);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    if (initialized) return;

    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ph";

    posthog.init(key, {
      api_host: apiHost,
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
    if (!authInitialized) return;

    if (isAuthenticated && user?.uid) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      const propsToSet: Record<string, unknown> = {
        uid: user.uid,
        role: user.role,
        phone: user.phone,
        $phone: user.phone,
        last_login_at: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
      };

      if (user.email) {
        propsToSet.email = user.email;
        propsToSet.$email = user.email;
      }
      if (fullName) {
        propsToSet.name = fullName;
        propsToSet.$name = fullName;
      }

      posthog.identify(
        user.uid,
        propsToSet,
        user.createdAt ? { signup_at: new Date(user.createdAt).toISOString() } : undefined
      );
    } else {
      posthog.reset();
    }
  }, [authInitialized, isAuthenticated, user]);

  return null;
}
