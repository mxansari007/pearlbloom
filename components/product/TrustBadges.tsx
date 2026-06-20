"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Droplets,
  Sparkles,
  Feather,
  Truck,
  Banknote,
  RotateCcw,
  Repeat,
} from "lucide-react";
import { useAppConfigStore } from "@/store/useAppStore";

type Item = {
  icon: React.ReactNode;
  label: string;
  sub: string;
  href?: string;
};

// Brand USPs (true for the catalogue per brand facts).
const USPS: Item[] = [
  { icon: <ShieldCheck size={20} />, label: "Anti-Tarnish", sub: "Stays bright longer" },
  { icon: <Droplets size={20} />, label: "Water-Resistant", sub: "Sweat & splash safe" },
  { icon: <Sparkles size={20} />, label: "Skin-Safe", sub: "Hypoallergenic & gentle" },
  { icon: <Feather size={20} />, label: "Lightweight", sub: "All-day comfort" },
];

function Strip({ items, label }: { items: Item[]; label: string }) {
  return (
    <ul aria-label={label} className="grid grid-cols-2 2xl:grid-cols-4 gap-2.5">
      {items.map((it) => {
        const inner = (
          <>
            <span className="shrink-0" style={{ color: "rgb(var(--gold-rgb))" }} aria-hidden>
              {it.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-tight break-words" style={{ color: "var(--fg)" }}>
                {it.label}
              </span>
              <span className="block text-xs leading-tight break-words" style={{ color: "var(--muted)" }}>
                {it.sub}
              </span>
            </span>
          </>
        );
        const cls =
          "flex items-center gap-2.5 rounded-xl px-3 py-2.5 h-full transition-colors";
        const style = { background: "var(--card-bg-soft)", border: "1px solid var(--card-border)" };
        return (
          <li key={it.label}>
            {it.href ? (
              <Link href={it.href} className={`${cls} hover:border-[rgba(var(--gold-rgb),0.4)]`} style={style}>
                {inner}
              </Link>
            ) : (
              <div className={cls} style={style}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function TrustBadges() {
  const freeShippingAbove = useAppConfigStore((s) => s.freeShippingAbove);
  const codEnabled = useAppConfigStore((s) => s.codEnabled);
  const returnDays = useAppConfigStore((s) => s.returnDays);
  const exchangeDays = useAppConfigStore((s) => s.exchangeDays);

  // Logistics row — only real, configured values; honest non-numeric labels otherwise.
  const logistics: Item[] = [];
  logistics.push({
    icon: <Truck size={20} />,
    label: typeof freeShippingAbove === "number" && freeShippingAbove > 0 ? "Free Shipping" : "Fast Shipping",
    sub:
      typeof freeShippingAbove === "number" && freeShippingAbove > 0
        ? `Over ₹${freeShippingAbove.toLocaleString("en-IN")}`
        : "Across India",
    href: "/shipping-and-delivery",
  });
  if (codEnabled) {
    logistics.push({ icon: <Banknote size={20} />, label: "COD Available", sub: "Cash on delivery" });
  }
  logistics.push({
    icon: <RotateCcw size={20} />,
    label: returnDays ? `${returnDays}-Day Return` : "Easy Returns",
    sub: "Quick refunds",
    href: "/returns-and-refunds",
  });
  if (exchangeDays) {
    logistics.push({
      icon: <Repeat size={20} />,
      label: `${exchangeDays}-Day Exchange`,
      sub: "Hassle-free",
      href: "/returns-and-refunds",
    });
  } else {
    logistics.push({
      icon: <ShieldCheck size={20} />,
      label: "Warranty & Care",
      sub: "Anti-tarnish promise",
      href: "/warranty-and-care",
    });
  }

  return (
    <div className="space-y-3">
      <Strip items={USPS} label="Product highlights" />
      <Strip items={logistics} label="Shipping and returns" />
    </div>
  );
}
