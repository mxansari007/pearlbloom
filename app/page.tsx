export const revalidate = 300;

import { Suspense } from "react";

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

async function OffersSection() {
  try {
    const snap = await dbAdmin
      .collection("coupons")
      .where("active", "==", true)
      .limit(6)
      .get();

    const offers = snap.docs
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
  } catch {
    return null;
  }
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
              className="container mx-auto px-6 py-14"
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

      {/* Footer subscription */}
      <section className="container mx-auto px-6 pb-14">
        <SubscribeForm />
      </section>
    </>
  );
}
