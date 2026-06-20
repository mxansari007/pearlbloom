# Pearl Bloom — Earrings On-Page SEO Build · REPORT

**Scope delivered:** On-page SEO for the entire earrings catalogue — the All Earrings hub + every Style, Finish and Occasion collection page — plus a pillar/cluster blog system, FAQ schema and breadcrumb schema. All output is deployable code in the repo (no chat-only copy).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4. Content authored as typed TS content modules (no new dependencies, matching the repo's existing data-driven pattern). SEO via the Next Metadata API + inline JSON-LD.

**Validation:** `tsc --noEmit` passes (0 errors). Live dev-server crawl of all 45 URLs: **45/45 return 200**, **45 unique meta titles / descriptions / H1s** (zero duplicates), **H1 ≠ meta title everywhere**, **89 JSON-LD blocks, 0 invalid**, **44 FAQPage schemas** present.

---

## 1. Pages created (36 collection pages)

> ⚠️ The brief stated "31 facet + 1 hub = 32". The repo's actual taxonomy is **13 styles + 13 finishes + 9 occasions = 35 facets + 1 hub = 36 pages** (13+13+9 = 35, not 31). All 36 were built.

Each page received: unique meta title (≤60), unique meta description (140–155), keyword-led H1 (distinct from title, with the original "Room" branding preserved as the kicker), unique intro copy with 2–5 inline internal links, a related-collections link block, a page-specific FAQ accordion + **FAQPage JSON-LD**, and **BreadcrumbList + CollectionPage JSON-LD**.

### Tier 1 — full build (15 pages · 300–450-word intro · 5–6 FAQs)
| Type | Pages |
|---|---|
| Hub | All Earrings |
| Style | Stud, Hoop, Drop, Jhumka, Chandbali, Statement |
| Finish | Gold Plated, Anti-Tarnish, Oxidised, Silver Tone |
| Occasion | Daily Wear, Office Wear, Party Wear, Wedding Wear |

### Tier 2 — lean build (21 pages · 150–250-word intro · 4 FAQs)
| Type | Pages |
|---|---|
| Style | Dangle, Ear Cuffs, Mismatch, Clip-on, Long, Huggies, Bali |
| Finish | Gold Tone, Waterproof, Enamel, Pearl, Crystal, CZ, American Diamond, Stone, Kundan |
| Occasion | Festive Wear, Bridal, College Wear, Gift, Earrings Set |

Intent differentiation (so no two facets read alike): **Style** pages lean transactional + styling; **Finish** pages lean material/care/quality; **Occasion** pages lean outfit-pairing + gifting.

---

## 2. Blogs created (8 posts · pillar + cluster model)

Pillars link **down** to their cluster facets; every facet page links **up** to its assigned pillar (via the "Read our…" link in the collection body).

| # | Post | Type | Words (approx) | Supports |
|---|---|---|---|---|
| 1 | Types of Earrings: A Complete Guide | Pillar | ~1,200 | All 13 styles + hub |
| 2 | Anti-Tarnish & Waterproof Earrings: How They Work & Care | Pillar | ~1,000 | anti-tarnish, waterproof, gold-plated, gold-tone, pearl |
| 3 | Earrings for Every Occasion: Daily to Bridal | Pillar | ~1,050 | All 9 occasions + hub |
| 4 | Oxidised vs Gold-Tone vs Silver-Tone | Pillar | ~1,000 | 10 finish pages |
| 5 | How to Style Jhumkas & Chandbalis | Pillar | ~1,000 | jhumka, chandbali, kundan, festive, wedding, bridal |
| 6 | How to Style Hoop Earrings for Your Face Shape | Focused | ~750 | hoop, huggies, bali |
| 7 | Stud Earrings: Everyday Style Guide | Focused | ~700 | stud, daily-wear, office-wear |
| 8 | Are Gold Plated Earrings Worth It? | Focused | ~700 | gold-plated, gold-tone, anti-tarnish |

Each post emits **Article + FAQPage + BreadcrumbList JSON-LD**, has a short FAQ, and a "Shop the collections" link block. The `/blog` index emits **Blog + BreadcrumbList** schema. A "Journal" link was added to the footer for discoverability.

---

## 3. Indexation & canonical decisions

- **Every collection page, blog post, the hub and `/blog`: `index, follow`, self-canonical** (`alternates.canonical`). These are all single-facet (one style OR finish OR occasion) — exactly the faceted-content guardrail's "indexable, self-canonical" case.
- **No `noindex` multi-facet pages exist.** The on-page filter (`EarringFilterBrowser`) is **client-side React state, not URL parameters**, so style+finish combinations never produce a crawlable URL. There is nothing to `noindex` or canonicalise away. ✅
- **Guardrail recommendations for the future** (noted, not yet needed):
  - If filters ever become URL-driven (e.g. `?finish=oxidised`), set those combination URLs to `noindex, follow` + canonical to the single-facet parent.
  - The legacy `/products?sort=…` query URLs should canonicalise to `/products` (the homepage/nav links to those were already repointed to the new `/earrings/new-arrivals` and `/earrings/best-sellers` pages in earlier work).

---

## 4. Schema / structured data

| Page type | JSON-LD emitted |
|---|---|
| Collection (facet) + hub | BreadcrumbList, CollectionPage, FAQPage |
| Blog post | BreadcrumbList, Article, FAQPage |
| Blog index | BreadcrumbList, Blog (with BlogPosting list) |

All validated as parseable JSON (0 invalid across 89 blocks). FAQ markup is rendered with native `<details>`/`<summary>` (accessible, no JS) and mirrored exactly in the FAQPage entities.

---

## 5. Brand / config changes made

- **Canonical domain corrected to `https://pearlbloom.in`** (was `pearlboom.in`, missing an "l") in: `app/layout.tsx` (metadataBase), `app/robots.ts`, `app/sitemap.ts`, `app/earrings/new-arrivals`, `app/earrings/best-sellers`, and the new pages/content. **Action required:** set `NEXT_PUBLIC_SITE_URL=https://pearlbloom.in` in Vercel so the env var matches the code default.
- **Global site metadata rewritten** (`app/layout.tsx`) from "Pearl Bloom — Exquisite Jewelry / rings, necklaces, earrings. Luxury designs" to an earrings-only, affordable-positioning title + description (no implication of fine jewellery or non-earring categories).
- **Sitemap** now includes `/blog` + all 8 posts (the 36 earrings pages were already covered).
- **Indian English + ₹** used throughout; **no over-claiming** — copy says gold-tone / gold-plated, CZ / American Diamond / crystal simulants, faux/shell pearls; never solid gold, real diamonds or hallmarking.

---

## 6. Files

**New** — `seo/earrings-content-map.csv`, `seo/REPORT.md`; `content/shared.ts`; `content/seo/earrings/{types,index,all-earrings,styles,finishes,occasions}.ts`; `content/blog/{types,index}.ts` + 8 post files; `components/{RichText,FaqAccordion,CollectionSeoBody}.tsx`; `components/blog/{BlogArticle,BlogCard}.tsx`; `app/blog/page.tsx`; `app/blog/[slug]/page.tsx`.

**Edited** — `app/earrings/[type]/[slug]/page.tsx`, `app/earrings/page.tsx` (wired SEO body + metadata); `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/earrings/new-arrivals/page.tsx`, `app/earrings/best-sellers/page.tsx` (domain); `app/globals.css` (SEO link / FAQ / prose styles); `components/Footer.tsx` (Journal link).

---

## 7. Gaps & recommendations

1. **Product-level tagging (biggest opportunity).** Collection copy references styles/finishes/occasions accurately and links to real routes, but does **not** name specific live products — facet tagging in the admin (`style[]/finish[]/occasion[]`) is only partially populated, and naming products in static copy would go stale. The filter already maps products to facets via admin tags (with a name-text fallback). **Recommendation:** finish tagging every product with Style/Finish/Occasion in the admin so each facet page is well-populated; some Tier-2 facets may currently show few products until tagged.
2. **Product/Offer schema.** Collection pages use `CollectionPage` only. Once tagging is complete, consider adding `ItemList`/`Product` + `Offer` (with ₹ price + availability) for richer results. Individual `/product/[slug]` pages currently have **no** Product JSON-LD — worth adding separately (out of this scope).
3. **Per-collection imagery.** Pages reuse `/earring.png` for OG. Each `CollectionSeo` includes a tailored `heroAlt` suggestion — add per-collection hero/OG images using those alt texts when available.
4. **Exposed admin secrets** remain unrotated (tracked separately) — unrelated to this SEO work but still outstanding.

---

## 8. Acceptance criteria — status

| Criterion | Status |
|---|---|
| 36 collection pages + pillar/cluster blogs, each with unique title, description, H1, copy, FAQ schema, breadcrumb schema | ✅ |
| Valid JSON-LD (FAQPage, Article, BreadcrumbList) — structure validated | ✅ 0 invalid / 89 blocks |
| All internal links resolve to real repo routes | ✅ (facet routes, hub, /blog, new/best) |
| No duplicate meta strings | ✅ 45/45 unique |
| No over-claiming on materials; Indian English + ₹ | ✅ |
| `content-map.csv` + `REPORT.md` present | ✅ |
