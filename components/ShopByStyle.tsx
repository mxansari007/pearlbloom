"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* Minimal custom earring glyphs (24x24, stroke = currentColor) */
const G = {
  stud: (
    <>
      <circle cx="12" cy="12" r="8" strokeDasharray="2 2.6" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
    </>
  ),
  hoop: (
    <>
      <circle cx="12" cy="13.5" r="6.2" />
      <path d="M12 7.3V4.6" />
      <circle cx="12" cy="3.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  drop: (
    <>
      <circle cx="12" cy="4.2" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 5.6v2.2" />
      <path d="M12 8.2C8.9 10.6 8.9 16.6 12 18.8C15.1 16.6 15.1 10.6 12 8.2Z" />
    </>
  ),
  dangle: (
    <>
      <circle cx="12" cy="3.8" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 5.2v1.5" />
      <circle cx="12" cy="8.6" r="1.7" />
      <path d="M12 10.6C9.4 12.6 9.4 16.8 12 18.6C14.6 16.8 14.6 12.6 12 10.6Z" />
    </>
  ),
  statement: (
    <>
      <circle cx="12" cy="4" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 6.4 17 10.4 15.1 16.6 8.9 16.6 7 10.4Z" />
    </>
  ),
  jhumka: (
    <>
      <circle cx="12" cy="4" r="1.1" fill="currentColor" stroke="none" />
      <path d="M6.6 14.5a5.4 5.4 0 0 1 10.8 0" />
      <path d="M6.6 14.5h10.8" />
      <path d="M8.7 14.7v2.4M12 14.7v3M15.3 14.7v2.4" />
    </>
  ),
  chandbali: (
    <>
      <circle cx="12" cy="3.8" r="1.1" fill="currentColor" stroke="none" />
      <path d="M15.5 7.2a6.4 6.4 0 1 0 0 9.6 4.9 4.9 0 1 1 0-9.6Z" />
    </>
  ),
  "ear-cuffs": (
    <>
      <path d="M16 7.2a6.2 6.2 0 1 0 0 9.6" />
      <circle cx="16" cy="7.2" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16.8" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  mismatch: (
    <>
      <path d="M8 4.5 9.1 7.6 12.2 8.7 9.1 9.8 8 12.9 6.9 9.8 3.8 8.7 6.9 7.6Z" fill="currentColor" stroke="none" />
      <circle cx="16.4" cy="15.8" r="2.7" />
    </>
  ),
  "clip-on": (
    <>
      <ellipse cx="10" cy="12" rx="2.6" ry="3.6" />
      <ellipse cx="14" cy="12" rx="2.6" ry="3.6" />
    </>
  ),
  long: (
    <>
      <circle cx="12" cy="3.4" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 4.8v9.4" />
      <path d="M12 14C9.9 15.8 9.9 19.4 12 21 14.1 19.4 14.1 15.8 12 14Z" />
    </>
  ),
  huggies: (
    <>
      <circle cx="12" cy="13" r="6" strokeWidth="2.8" />
      <circle cx="12" cy="4.4" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  bali: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4.2v15.6M8.6 5.3v13.4M15.4 5.3v13.4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

const styles: { label: string; slug: keyof typeof G }[] = [
  { label: "Stud", slug: "stud" },
  { label: "Hoop", slug: "hoop" },
  { label: "Drop", slug: "drop" },
  { label: "Dangle", slug: "dangle" },
  { label: "Statement", slug: "statement" },
  { label: "Jhumka", slug: "jhumka" },
  { label: "Chandbali", slug: "chandbali" },
  { label: "Ear Cuffs", slug: "ear-cuffs" },
  { label: "Mismatch", slug: "mismatch" },
  { label: "Clip-On", slug: "clip-on" },
  { label: "Long", slug: "long" },
  { label: "Huggies", slug: "huggies" },
  { label: "Bali", slug: "bali" },
];

export default function ShopByStyle() {
  const trackRef = useRef<HTMLDivElement>(null);

  const slide = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="relative" style={{ background: "var(--bg)" }}>
      <div className="container py-16 md:py-20">
        {/* Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-9">
          <div>
            <span
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.28em] mb-3"
              style={{ color: "rgb(var(--bronze-rgb))" }}
            >
              Explore by Form
            </span>
            <h2
              className="font-display italic text-3xl md:text-4xl"
              style={{ color: "var(--fg)", fontWeight: 400 }}
            >
              Shop All 13 Earring Styles
            </h2>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-5">
            <p className="max-w-xs text-sm md:text-right" style={{ color: "var(--muted)" }}>
              From studs to chandbalis, every style in one place. Swipe to find your shape.
            </p>
            <div className="flex gap-2 shrink-0">
              <button type="button" className="style-nav-btn" aria-label="Previous styles" onClick={() => slide(-1)}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="style-nav-btn" aria-label="Next styles" onClick={() => slide(1)}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div
          ref={trackRef}
          className="no-scrollbar flex gap-3 md:gap-4 pt-3 pb-2 snap-x"
          style={{ overflowX: "auto", overflowY: "hidden" }}
        >
          {styles.map(({ label, slug }) => (
            <Link
              key={slug}
              href={`/earrings/style/${slug}`}
              className="style-card group snap-start shrink-0 w-[118px] sm:w-[136px] md:w-[150px] flex flex-col items-center justify-center gap-4 rounded-2xl px-3 py-7 text-center"
            >
              <span className="style-glyph flex items-center justify-center h-10 w-10">
                <svg
                  viewBox="0 0 24 24"
                  width="34"
                  height="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {G[slug]}
                </svg>
              </span>
              <span className="style-label text-[11px] font-semibold uppercase tracking-[0.14em]">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
