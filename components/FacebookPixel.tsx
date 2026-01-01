"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import * as pixel from "../libs/fpixel";
import { useAppConfigStore } from "@/store/useAppStore";

const FacebookPixel = () => {
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const pixelId = pixel.FB_PIXEL_ID;
  const configLoaded = useAppConfigStore((s) => s.configLoaded);
  const testMode = useAppConfigStore((s) => s.testMode);

  const shouldRender = Boolean(pixelId) && configLoaded && !testMode;

  useEffect(() => {
    if (!shouldRender) return;
    if (!loaded) return;
    pixel.pageview();
  }, [loaded, pathname, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div>
      <Script
        id="fb-pixel"
        src="/scripts/pixel.js"
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
        data-pixel-id={pixelId}
      />
    </div>
  );
};

export default FacebookPixel;
