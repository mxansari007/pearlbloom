"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    if (!pixelId) return;
    if (typeof (window as any).fbq !== "function") return;

    (window as any).fbq("track", "PageView");
  }, [pathname, searchParams]);

  return null;
}

