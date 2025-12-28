"use client";

import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { app } from "@/libs/firebase-client";

let initialized = false;

export function initAppCheck() {
  if (initialized) return;
  if (typeof window === "undefined") return;

  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(
      process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY!
    ),
    isTokenAutoRefreshEnabled: true,
  });

  initialized = true;
}
