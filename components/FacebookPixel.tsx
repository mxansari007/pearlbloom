"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    if (!pixelId) return;
    let cancelled = false;
    let attempt = 0;

    const trackPageView = () => {
      if (cancelled) return;
      const fbq = (window as any).fbq;
      if (typeof fbq === "function") {
        fbq("track", "PageView");
        return;
      }

      attempt += 1;
      if (attempt >= 15) return;
      setTimeout(trackPageView, 200);
    };

    trackPageView();

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  return null;
}
