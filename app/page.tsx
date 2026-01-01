export const revalidate = 300;

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import CollectionCard from "../components/CollectionCard";
import SubscribeForm from "../components/SubscriptionForm";

import { getHomepageSections } from "../libs/homepage.server";
import { getProductsByIds } from "../libs/products.server";
import { getCollectionsByIds } from "../libs/collections.server";
import { getHeroData } from "../libs/hero.server";
import { dbAdmin } from "../libs/firebase-admin";

import type { Product } from "../types/products";

type FeaturedProductsSectionData = {
  id: string;
  type: "featuredProducts";
  title: string;
  productIds?: string[];
};

type CollectionsRowSectionData = {
  id: string;
  type: "collectionsRow";
  title: string;
  collectionIds?: string[];
};

type BannerSectionData = {
  id: string;
  type: "banner";
  title: string;
};

type HomepageSection =
  | FeaturedProductsSectionData
  | CollectionsRowSectionData
  | BannerSectionData;

type BannerPlacement = "home_top" | "home_bottom";
type BannerSize = "sm" | "md" | "lg";

type BannerItem = {
  id: string;
  imageUrl: string | null;
  alt: string | null;
  href: string | null;
  label: string | null;
  active: boolean;
};

type BannerCarousel = {
  id: string;
  placement: BannerPlacement;
  size: BannerSize;
  title: string | null;
  subtitle: string | null;
  items: BannerItem[];
};

/* ---------------------------------------------------------------- */
/* Skeletons */
/* ---------------------------------------------------------------- */

function SectionSkeleton({ title }: { title?: string }) {
  return (
    <section className="container mx-auto px-6 py-14 animate-pulse">
      {title && (
        <div className="h-8 w-64 bg-white/10 rounded mb-6" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-neutral-900/60 border border-white/5 p-4"
          >
            <div className="aspect-[3/4] rounded-xl bg-white/10" />
            <div className="mt-4 h-4 w-3/4 bg-white/10 rounded" />
            <div className="mt-2 h-4 w-1/2 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

function CollectionsSkeleton({ title }: { title?: string }) {
  return (
    <section className="container mx-auto px-6 py-14 animate-pulse">
      {title && (
        <div className="h-7 w-56 bg-white/10 rounded mb-6" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-56 rounded-xl bg-white/10"
          />
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Streamed Sections */
/* ---------------------------------------------------------------- */

async function FeaturedProductsSection({
  section,
}: {
  section: FeaturedProductsSectionData;
}) {
  const products: Product[] = await getProductsByIds(
    section.productIds ?? []
  );

  if (!products.length) return null;

  return (
    <section className="container mx-auto px-6 py-14">
      <h2 className="text-3xl font-display mb-6">
        {section.title}
      </h2>

      <ProductGrid products={products} />
    </section>
  );
}

async function CollectionsRowSection({
  section,
}: {
  section: CollectionsRowSectionData;
}) {
  if (!section.collectionIds?.length) return null;

  const collections = await getCollectionsByIds(
    section.collectionIds
  );

  if (!collections.length) return null;

  return (
    <section className="container mx-auto px-6 py-14">
      <h2 className="text-2xl font-display mb-6">
        {section.title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {collections.map((c) => (
          <CollectionCard
            key={c.id}
            title={c.name}
            slug={c.slug}
            thumbnail={c.thumbnail}
          />
        ))}
      </div>
    </section>
  );
}

function normalize(v: unknown) {
  return String(v ?? "").trim();
}

function normalizeCode(value: string) {
  const upper = normalize(value).toUpperCase();
  return upper
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  if (typeof v === "number") return v !== 0;
  return Boolean(v);
}

function asNumberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asStringOrNull(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asTimestampMs(v: unknown): number | null {
  if (!v) return null;
  if (isRecord(v) && typeof v.toDate === "function") {
    const d = (v.toDate as () => unknown)();
    if (d instanceof Date && !Number.isNaN(d.getTime())) return d.getTime();
  }
  const s = asStringOrNull(v);
  if (s) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  const n = asNumberOrNull(v);
  if (typeof n === "number") return n;
  return null;
}

function buildOfferSummary(args: {
  discountType: "percent" | "flat";
  discountValue: number;
  maxDiscount: number | null;
  minSubtotal: number | null;
}) {
  const parts: string[] = [];
  parts.push(args.discountType === "percent" ? `${args.discountValue}% off` : `₹${Math.round(args.discountValue).toLocaleString("en-IN")} off`);
  if (typeof args.maxDiscount === "number" && args.maxDiscount > 0) parts.push(`up to ₹${Math.round(args.maxDiscount).toLocaleString("en-IN")}`);
  if (typeof args.minSubtotal === "number" && args.minSubtotal > 0) parts.push(`on orders ₹${Math.round(args.minSubtotal).toLocaleString("en-IN")}+`);
  return parts.join(" ");
}

function getBannerPlacement(v: unknown): BannerPlacement | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (s === "home_top" || s === "home-top" || s === "top") return "home_top";
  if (s === "home_bottom" || s === "home-bottom" || s === "bottom") return "home_bottom";
  return null;
}

function getBannerSize(v: unknown): BannerSize {
  if (typeof v !== "string") return "md";
  const s = v.trim().toLowerCase();
  if (s === "sm" || s === "small") return "sm";
  if (s === "lg" || s === "large") return "lg";
  return "md";
}

const PLACEHOLDER_BANNER_IMAGES = [
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1522338140500-02d2751f1750?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1600&q=80",
];

async function BannerCarouselSection({ placement }: { placement: BannerPlacement }) {
  let carousels: BannerCarousel[] = [];

  try {
    const snap = await dbAdmin
      .collection("bannerCarousels")
      .where("active", "==", true)
      .limit(10)
      .get();

    carousels = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as Record<string, unknown> & { id: string })
      .map((raw): BannerCarousel | null => {
        const p = getBannerPlacement(raw["placement"]);
        if (!p || p !== placement) return null;
        const itemsRaw = Array.isArray(raw["items"]) ? (raw["items"] as unknown[]) : [];
        const items = itemsRaw
          .map((it, idx): BannerItem | null => {
            if (!isRecord(it)) return null;
            const active = "active" in it ? asBoolean(it["active"]) : true;
            if (!active) return null;
            const imageUrl = asStringOrNull(it["imageUrl"]) ?? asStringOrNull(it["image"]);
            const alt = asStringOrNull(it["alt"]) ?? asStringOrNull(it["title"]) ?? null;
            const href = asStringOrNull(it["href"]) ?? asStringOrNull(it["link"]) ?? null;
            const label = asStringOrNull(it["label"]) ?? null;
            return {
              id: asStringOrNull(it["id"]) ?? `${idx}`,
              imageUrl,
              alt,
              href,
              label,
              active,
            };
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x));

        if (!items.length) return null;

        return {
          id: raw.id,
          placement,
          size: getBannerSize(raw["size"]),
          title: asStringOrNull(raw["title"]),
          subtitle: asStringOrNull(raw["subtitle"]),
          items,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  } catch {
    return null;
  }

  if (!carousels.length) return null;

  return (
    <>
      {carousels.map((c) => (
        <section key={c.id} className="banner-carousel">
          {c.title ? (
            <div className="banner-carousel__header">
              <div className="banner-carousel__titleWrap">
                <h2 className="banner-carousel__title">{c.title}</h2>
                {c.subtitle ? <div className="banner-carousel__subtitle">{c.subtitle}</div> : null}
              </div>
            </div>
          ) : null}

          <div className={`banner-carousel__track banner-carousel__track--${c.size}`} aria-label="Promotions">
            {c.items.map((b, idx) => {
              const src = b.imageUrl || PLACEHOLDER_BANNER_IMAGES[idx % PLACEHOLDER_BANNER_IMAGES.length];
              const alt = b.alt || "Promotion banner";
              const slide = (
                <div className="banner-carousel__slide">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 88vw, 420px"
                    style={{ objectFit: "cover" }}
                    priority={placement === "home_top" && idx === 0}
                  />
                  {b.label ? <div className="banner-carousel__label">{b.label}</div> : null}
                </div>
              );

              return b.href ? (
                <Link key={b.id} href={b.href} className="banner-carousel__link" aria-label={alt}>
                  {slide}
                </Link>
              ) : (
                <div key={b.id} className="banner-carousel__link" aria-label={alt}>
                  {slide}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

async function OffersSection() {
  let offers: { id: string; code: string; title: string | null; summary: string; terms: string }[] = [];

  try {
    const snap = await dbAdmin
      .collection("coupons")
      .where("active", "==", true)
      .limit(6)
      .get();

    offers = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as Record<string, unknown> & { id: string })
      .map((c) => {
        const discountObj = isRecord(c.discount) ? c.discount : null;
        const code = normalizeCode(asStringOrNull(c.code) ?? c.id);
        const discountTypeRaw = asStringOrNull(c.discountType) ?? asStringOrNull(c.type) ?? asStringOrNull(c.discount_type);
        const discountType = (() => {
          const s = (discountTypeRaw ?? "").trim().toLowerCase();
          if (s === "percent" || s === "percentage" || s === "percent(%)" || s === "percent (%)") return "percent";
          if (s === "flat" || s === "fixed" || s === "amount") return "flat";
          return null;
        })();
        const discountValue =
          asNumberOrNull(c.discountValue) ??
          asNumberOrNull(c.value) ??
          asNumberOrNull(c.amount) ??
          asNumberOrNull(c.percentOff) ??
          asNumberOrNull(c.flatOff) ??
          asNumberOrNull(discountObj?.value) ??
          asNumberOrNull(discountObj?.amount);
        const discountTypeFinal = discountType ?? (() => {
          const s = asStringOrNull(discountObj?.type)?.trim().toLowerCase() ?? "";
          if (s === "percent" || s === "percentage" || s === "percent(%)" || s === "percent (%)") return "percent";
          if (s === "flat" || s === "fixed" || s === "amount") return "flat";
          return null;
        })();
        if (!code || !discountTypeFinal || typeof discountValue !== "number" || discountValue <= 0) return null;
        const startAtMs = asTimestampMs(c.startAt) ?? asTimestampMs(c.startsAt) ?? asTimestampMs(c.startDate);
        const endAtMs = asTimestampMs(c.endAt) ?? asTimestampMs(c.expiresAt) ?? asTimestampMs(c.endDate);

        const maxDiscount =
          asNumberOrNull(c.maxDiscount) ??
          asNumberOrNull(c.max_discount) ??
          asNumberOrNull(discountObj?.maxDiscount);
        const minSubtotal =
          asNumberOrNull(c.minSubtotal) ??
          asNumberOrNull(c.min_subtotal) ??
          asNumberOrNull(discountObj?.minSubtotal);
        const title = asStringOrNull(c.title);
        const summary = buildOfferSummary({ discountType: discountTypeFinal, discountValue, maxDiscount, minSubtotal });

        const termsParts: string[] = [];
        termsParts.push(summary);
        if (startAtMs) termsParts.push(`Starts ${new Date(startAtMs).toLocaleDateString("en-IN")}`);
        if (endAtMs) termsParts.push(`Ends ${new Date(endAtMs).toLocaleDateString("en-IN")}`);
        const terms = termsParts.join(" • ");

        return { id: c.id as string, code, title, summary, terms };
      })
      .filter((o): o is NonNullable<typeof o> => Boolean(o))
      .slice(0, 3);
  } catch {
    return null;
  }

  if (!offers.length) return null;

  return (
    <section className="container mx-auto px-6 py-14">
      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <h2 className="text-2xl font-display">Current Offers</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Apply these at cart or checkout.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {offers.map((o) => (
          <div
            key={o.id}
            className="rounded-2xl p-5"
            style={{
              background: "var(--panel-bg-soft)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>
                  Coupon code
                </div>
                <div className="text-lg font-medium truncate">{o.code}</div>
                {o.title ? (
                  <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                    {o.title}
                  </div>
                ) : null}
              </div>
              <div
                className="shrink-0 text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(var(--gold-rgb),0.12)",
                  border: "1px solid rgba(var(--gold-rgb),0.22)",
                  color: "rgb(var(--gold-rgb))",
                }}
                title={o.terms}
              >
                Details
              </div>
            </div>

            <div className="mt-4 text-sm" style={{ color: "rgb(var(--gold-rgb))" }}>
              {o.summary}
            </div>

            <div className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
              Hover “Details” for terms.
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Page */
/* ---------------------------------------------------------------- */

export default async function Home() {
  const heroDataPromise = getHeroData();
  const sectionsPromise = getHomepageSections();

  const [hero, sections] = await Promise.all([
    heroDataPromise,
    sectionsPromise,
  ]);

  return (
    <>
      {/* Hero renders immediately (blocking LCP) */}
      <Hero hero={hero} />

      <Suspense fallback={null}>
        <BannerCarouselSection placement="home_top" />
      </Suspense>

      {/* Stream each section independently */}
      {(sections as HomepageSection[]).map((section) => {
        if (section.type === "featuredProducts") {
          return (
            <Suspense
              key={section.id}
              fallback={<SectionSkeleton title={section.title} />}
            >
              <FeaturedProductsSection section={section} />
            </Suspense>
          );
        }

        if (section.type === "collectionsRow") {
          return (
            <Suspense
              key={section.id}
              fallback={<CollectionsSkeleton title={section.title} />}
            >
              <CollectionsRowSection section={section} />
            </Suspense>
          );
        }

        if (section.type === "banner") {
          return (
            <section
              key={section.id}
              className="container py-10 md:py-14"
            >
              <h2 className="text-2xl font-display">
                {section.title}
              </h2>
            </section>
          );
        }

        return null;
      })}

      <Suspense fallback={null}>
        <OffersSection />
      </Suspense>

      <Suspense fallback={null}>
        <BannerCarouselSection placement="home_bottom" />
      </Suspense>

      {/* Footer subscription */}
      <section className="container pb-10 md:pb-14">
        <SubscribeForm />
      </section>
    </>
  );
}
