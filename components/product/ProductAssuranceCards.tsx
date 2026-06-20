"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { useAppConfigStore } from "@/store/useAppStore";
import { resolveFeatureIcon } from "./featureIcons";
import type { AssuranceCard } from "@/types/products";

/**
 * Two assurance cards shown under the gallery (mirrors the reference design's
 * "purity / warranty" pair).
 *
 * When the admin has set cards on the product (`cards` prop), those are
 * rendered verbatim and the result is fully server-safe (no store, no flash).
 *
 * When a product has NO admin-set cards (legacy items), we fall back to the
 * original honest behaviour: a fixed finish card plus a policy card driven by
 * the storefront config (real returns/exchange days), with an anti-tarnish
 * default until a policy is configured.
 */
export default function ProductAssuranceCards({
  cards,
}: {
  cards?: AssuranceCard[];
}) {
  const returnDays = useAppConfigStore((s) => s.returnDays);
  const exchangeDays = useAppConfigStore((s) => s.exchangeDays);
  const configLoaded = useAppConfigStore((s) => s.configLoaded);
  const loadConfig = useAppConfigStore((s) => s.loadConfig);

  // Persisted config rehydrates from localStorage before React hydrates, so
  // render the server-safe default until mounted to keep SSR and the first
  // client render identical (only matters for the dynamic fallback below).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!configLoaded) loadConfig();
  }, [configLoaded, loadConfig]);

  const adminCards = (cards ?? []).filter(
    (c) => c && (c.title?.trim() || c.eyebrow?.trim())
  );

  let rendered: { icon: ReactNode; eyebrow: string; title: string }[];

  if (adminCards.length > 0) {
    rendered = adminCards.map((c) => ({
      icon: resolveFeatureIcon(c.icon, 14),
      eyebrow: c.eyebrow,
      title: c.title,
    }));
  } else {
    // Legacy fallback (products with no admin-set cards yet).
    let policyEyebrow = "Everyday Durable";
    let policyTitle = "Anti-Tarnish Coating";
    if (mounted && typeof exchangeDays === "number" && exchangeDays > 0) {
      policyEyebrow = "Easy Exchange";
      policyTitle = `${exchangeDays}-Day Exchange Window`;
    } else if (mounted && typeof returnDays === "number" && returnDays > 0) {
      policyEyebrow = "Easy Returns";
      policyTitle = `${returnDays}-Day Return Window`;
    }
    rendered = [
      { icon: <Sparkles size={14} />, eyebrow: "Crafted Finish", title: "18K Gold-Tone Plating" },
      { icon: <ShieldCheck size={14} />, eyebrow: policyEyebrow, title: policyTitle },
    ];
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {rendered.map((c, i) => (
        <div
          key={`${c.eyebrow}-${i}`}
          className="rounded-2xl transition-transform duration-300 hover:-translate-y-0.5"
          style={{
            padding: "0.72rem",
            background: "linear-gradient(140deg, #fdeff2 0%, #f8e7ea 55%, #ffffff 100%)",
            border: "1px solid rgba(94,24,48,0.14)",
            boxShadow: "0 12px 26px -18px rgba(44,10,20,0.40)",
          }}
        >
          <p
            className="font-semibold uppercase tracking-[0.16em]"
            style={{ color: "rgba(61,15,26,0.6)", fontSize: "0.55rem" }}
          >
            {c.eyebrow}
          </p>
          <div className="mt-1.5 flex items-center" style={{ gap: "0.5rem" }}>
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
              style={{ background: "rgba(94,24,48,0.08)", color: "#5e1830", transform: "translateY(-6px)" }}
            >
              {c.icon}
            </span>
            <p className="font-semibold leading-snug" style={{ color: "#5e1830", fontSize: "0.77rem", transform: "translateY(1px)" }}>
              {c.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
