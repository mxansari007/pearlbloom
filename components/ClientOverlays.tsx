"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });
const ChatWidget = dynamic(() => import("./ChatWIdget"), { ssr: false });

export default function ClientOverlays() {
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    const load = () => setChatReady(true);
    const idle = window.requestIdleCallback?.(load, { timeout: 2500 });
    const timer = idle === undefined ? window.setTimeout(load, 1200) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return <>{<CartDrawer />}{chatReady ? <ChatWidget /> : null}</>;
}
