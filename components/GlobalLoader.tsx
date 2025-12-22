"use client";

import { useUIStore } from "@/store/ui-store";

export default function GlobalLoader() {
  const isNavigating = useUIStore((s) => s.isNavigating);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
    </div>
  );
}