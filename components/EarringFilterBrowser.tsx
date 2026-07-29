"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "../types/products";
import ProductCard from "./ProductCard";
import {
  STYLE_CATEGORIES,
  FINISH_CATEGORIES,
  OCCASION_CATEGORIES,
  type CatType,
  type EarringCategory,
} from "../libs/earringCategories";
import { Filter, Check, Lock, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { getProductPriceInfo, getStartingVariantPriceInfo } from "../libs/pricing";

type Props = {
  products: Product[];
  lockedType?: CatType;
  lockedSlug?: string;
};

const SECTIONS: { key: CatType; title: string; items: EarringCategory[] }[] = [
  { key: "style", title: "Explore by Style", items: STYLE_CATEGORIES },
  { key: "finish", title: "Narrow by Finish", items: FINISH_CATEGORIES },
  { key: "occasion", title: "Filter by Occasion", items: OCCASION_CATEGORIES },
];

function hayMatches(hay: string, c: EarringCategory) {
  return hay.includes(c.name.toLowerCase()) || hay.includes(c.slug.replace(/-/g, " "));
}

type Selected = Record<CatType, string[]>;

function getDisplayPrice(p: Product): number {
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const info =
    variants.length > 0
      ? getStartingVariantPriceInfo(p)
      : getProductPriceInfo(p);
  return info?.final ?? 0;
}

export default function EarringFilterBrowser({ products, lockedType, lockedSlug }: Props) {
  const [sel, setSel] = useState<Selected>({ style: [], finish: [], occasion: [] });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ style: true });
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    if (!mobileOpen) return;
    document.documentElement.classList.add("no-scroll");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("no-scroll");
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const isLocked = (key: CatType, slug: string) => key === lockedType && slug === lockedSlug;

  const toggle = (key: CatType, slug: string) => {
    if (isLocked(key, slug)) return;
    setSel((s) => ({
      ...s,
      [key]: s[key].includes(slug) ? s[key].filter((x) => x !== slug) : [...s[key], slug],
    }));
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const clearAll = () => {
    setSel({ style: [], finish: [], occasion: [] });
    setPriceMin("");
    setPriceMax("");
    setOpenSections({});
  };

  const effective = useMemo<Selected>(() => {
    const e: Selected = { style: [...sel.style], finish: [...sel.finish], occasion: [...sel.occasion] };
    if (lockedType && lockedSlug && !e[lockedType].includes(lockedSlug)) {
      e[lockedType] = [lockedSlug, ...e[lockedType]];
    }
    return e;
  }, [sel, lockedType, lockedSlug]);

  const hasPriceFilter = priceMin !== "" || priceMax !== "";
  const userCount = sel.style.length + sel.finish.length + sel.occasion.length + (hasPriceFilter ? 1 : 0);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const hay = [p.name, ...(p.categories ?? [])].join(" ").toLowerCase();
      for (const section of SECTIONS) {
        const slugs = effective[section.key];
        if (!slugs.length) continue;
        const tagged = p[section.key] ?? [];
        const ok = slugs.some((slug) => {
          if (tagged.includes(slug)) return true;
          const c = section.items.find((i) => i.slug === slug);
          return c && hayMatches(hay, c);
        });
        if (!ok) return false;
      }

      if (hasPriceFilter) {
        const price = getDisplayPrice(p);
        if (priceMin !== "" && price < Number(priceMin)) return false;
        if (priceMax !== "" && price > Number(priceMax)) return false;
      }

      return true;
    });
  }, [products, effective, priceMin, priceMax, hasPriceFilter]);

  const display = filtered.length === 0 && userCount === 0 ? products : filtered;

  const renderSections = () =>
    SECTIONS.map((section) => {
      const count = effective[section.key].length;
      const isOpen = openSections[section.key] ?? false;
      return (
        <div key={section.key} className="filter-section">
          <button
            type="button"
            onClick={() => toggleSection(section.key)}
            className="filter-section__header"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--fg)" }}>
              {section.title}
            </span>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(var(--gold-rgb),0.16)", color: "rgb(var(--bronze-rgb))" }}
                >
                  {count}
                </span>
              )}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                style={{ color: "var(--muted)" }}
              />
            </div>
          </button>
          {isOpen && (
            <div className="filter-section__body space-y-1">
              {section.items.map((c) => {
                const active = effective[section.key].includes(c.slug);
                const locked = isLocked(section.key, c.slug);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggle(section.key, c.slug)}
                    className={`filter-option ${active ? "is-active" : ""} w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm`}
                  >
                    <span className="flex items-center gap-2 text-left">
                      {active && <Check size={14} />}
                      <span className={active ? "font-semibold" : ""}>{c.name}</span>
                    </span>
                    {locked && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
                        <Lock size={11} /> Lock
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    });

  const PriceSection = (
    <div className="filter-section">
      <button
        type="button"
        onClick={() => toggleSection("price")}
        className="filter-section__header"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--fg)" }}>
          Filter by Price
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${openSections["price"] ? "rotate-180" : ""}`}
          style={{ color: "var(--muted)" }}
        />
      </button>
      {openSections["price"] && (
        <div className="filter-section__body">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min ₹"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="filter-price-input"
              min="0"
            />
            <span className="text-sm shrink-0" style={{ color: "var(--muted)" }}>—</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="filter-price-input"
              min="0"
            />
          </div>
        </div>
      )}
    </div>
  );

  const Panel = (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--filter-bg)",
        border: "1px solid var(--filter-border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-2" style={{ borderBottom: "1px solid var(--hero-hairline)" }}>
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: "rgb(var(--bronze-rgb))" }} />
          <span className="font-display italic text-lg" style={{ color: "var(--fg)", fontWeight: 400 }}>
            Filters
          </span>
        </div>
        <button
          type="button"
          onClick={clearAll}
          disabled={userCount === 0}
          className="text-[11px] font-semibold uppercase tracking-[0.12em] transition-opacity disabled:opacity-40"
          style={{ color: "rgb(var(--bronze-rgb))" }}
        >
          Clear All
        </button>
      </div>

      {renderSections()}
      {PriceSection}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-24 h-fit filter-browser-scroll">{Panel}</aside>

      {/* Main */}
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between gap-4 mb-5">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Showing <strong style={{ color: "var(--fg)" }}>{display.length}</strong> earrings
          </p>
          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={(e) => {
              // Prevent a surrounding mobile navigation target from treating
              // this panel control as a click on the home link.
              e.preventDefault();
              e.stopPropagation();
              setMobileOpen(true);
            }}
            className="lg:hidden inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ border: "1px solid var(--hero-card-border)", background: "var(--hero-card)", color: "var(--fg)" }}
          >
            <SlidersHorizontal size={16} />
            Filters{userCount > 0 ? ` (${userCount})` : ""}
          </button>
        </div>

        {display.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {display.map((p, i) => (
              <ProductCard key={p.slug || p.id} product={p} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl" style={{ border: "1px dashed var(--hero-card-border)" }}>
            <p className="text-base" style={{ color: "var(--muted)" }}>
              No earrings match these filters.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "rgb(var(--bronze-rgb))" }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      <div
        className={`mm-backdrop fixed inset-0 z-50 flex lg:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setMobileOpen(false);
        }}
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        {/* Wrapper — positioned like CartDrawer: right edge, full height, p-3 gap */}
        <div
          className={`mm-panel-wrap absolute right-0 top-0 h-full w-full max-w-md p-3 ${
            mobileOpen ? "is-open" : ""
          }`}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="mm-panel flex flex-col h-full overflow-hidden rounded-[28px]"
          >
          <div className="flex flex-col h-full overflow-hidden px-5 py-5">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Filter size={18} style={{ color: "rgb(var(--bronze-rgb))" }} />
                <span className="font-display italic text-xl" style={{ color: "var(--fg)", fontWeight: 400 }}>
                  Filters
                </span>
                {userCount > 0 && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(var(--gold-rgb),0.16)", color: "rgb(var(--bronze-rgb))" }}
                  >
                    {userCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileOpen(false)}
                className="mm-close flex items-center justify-center w-9 h-9 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sections — whole-area scroll */}
            <div className="mt-3 flex-1 min-h-0 overflow-y-auto -mr-2 pr-1.5 filter-browser-scroll">
              {renderSections()}
              {PriceSection}
            </div>

            {/* Footer */}
            <div
              className="mt-4 pt-4 pb-[env(safe-area-inset-bottom,0px)] shrink-0 flex items-center gap-3"
              style={{ borderTop: "1px solid var(--header-border)" }}
            >
              <button
                type="button"
                onClick={clearAll}
                disabled={userCount === 0}
                className="rounded-2xl px-4 py-3.5 text-sm font-semibold uppercase tracking-wide transition-opacity disabled:opacity-40"
                style={{ border: "1px solid var(--header-border)", color: "rgb(var(--bronze-rgb))" }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="mm-shop flex-1 flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold uppercase tracking-wide text-white"
              >
                Show {display.length} earrings
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
