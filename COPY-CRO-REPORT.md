# Pearl Bloom — Homepage Copy & CRO Report

_Honest-claims rewrite of the homepage. Indian English, ₹INR. No fabricated reviews, prices, materials or certifications._

**Date:** 2026-06-20
**Scope:** Copy-only pass on the homepage and its components. Layout, structure and functionality were left untouched. No dependencies added.

---

## 1. Summary

The homepage looked premium but **over-promised**. It claimed things the brand does not actually offer — "medical-grade stainless steel", "heavy gold protective plating", "18K gold", "100% tarnish-resistant", "freshwater pearls", "waterproof" — and it invented a price band (₹153–₹399) that does not come from the catalogue. The SEO content layer (`content/seo/earrings/*`) was already honest; the homepage was the part that drifted.

This pass brings the homepage in line with what is true:

- **Gold-tone / gold-plated look** (always the word "plated"), not solid or 18K gold.
- **Anti-tarnish, skin-safe / hypoallergenic, lightweight, water-resistant** — the real USPs.
- **Faux & shell pearls**, not freshwater/organic.
- **Honest pricing** stated as "most pieces under ₹499, sets under ₹999" (the owner-confirmed bands) instead of an invented exact range.
- **No fabricated social proof** — the review block and hero rating stay hidden until real reviews exist (already correctly gated in code).

All changes are **live and verified** in the dev server on `:3000` (no build errors; new copy renders, all old over-claims gone).

> **Important:** copy in the *components* is now clean, but some claims live in **data**, not code — live product titles/descriptions in Firestore and the `data/catalog.json` fallback. Those are flagged in §4 and need an owner/admin action; this copy pass cannot reach them.

---

## 2. Section-by-section: before → after

### Hero (`components/Hero.tsx`)

| Element | Before | After | Why |
|---|---|---|---|
| Eyebrow badge | "Real Gold-Look. Lightweight. Anti-Tarnish." | "Skin-Safe. Lightweight. Anti-Tarnish." | Leads with the #1 customer worry (sensitive-ear safety). |
| Feature ticks | Anti-Tarnish · Skin-Safe · **Waterproof** | **Skin-Safe** · Anti-Tarnish · **Water-Resistant** | Skin-safe first; "waterproof" softened to the defensible "water-resistant". |
| Subtitle | "We **handcraft** gorgeous gold-plated… Safe for sensitive ears, **100% tarnish-resistant**, and honestly priced…" | "Gold-tone earrings made to be kind to sensitive ears — anti-tarnish, lightweight and water-resistant… Skin-safe, hypoallergenic and honestly priced, with no luxury markups." | Removes unverified "handcraft" and the absolute "100% tarnish-resistant" (→ "anti-tarnish"). |

_Headline ("Wear the Warmth of Everyday Gold…") kept as-is — it is honest and on-brand. Two alternative headlines are offered in `copy-assets.md` if you want to A/B it._

### Shop by Style (`components/ShopByStyle.tsx`)

| Element | Before | After | Why |
|---|---|---|---|
| Heading | "Shop All 13 Style **Taxonomies**" | "Shop All 13 Earring **Styles**" | "Taxonomies" is jargon shoppers don't use. |
| Intro | "Every pair of earrings is **dynamically classified** to ease your styling search. Swipe to explore families." | "From studs to chandbalis, every style in one place. Swipe to find your shape." | Plain, benefit-led language. |

### Shop by Occasion + Finishes (`components/OccasionsFinishes.tsx`)

**Finishes (the worst over-claims):**

| Before | After | Why |
|---|---|---|
| **18K Gold Plated** — "Lustrous **thick micro-plating** layers" — _Artisan Luster_ | **Gold Plated** — "Warm gold-tone shine over a durable core" — _Everyday Gold_ | Not every piece is 18K; "thick micro-plating" is unverifiable. |
| **Waterproof** — "**Shower, swim**, and sweat-safe coatings" — _Gym & Resort_ | **Water-Resistant** — "Built for sweat, rain and everyday splashes" — _Active Days_ | "Shower/swim-safe" is a blanket claim we can't stand behind. |
| **Organic Pearl** — "Individually selected **freshwater baroque** pearls" — _Natural Gloss_ | **Faux Pearl** — "Soft-lustre faux and shell pearls" — _Timeless_ | They are faux & shell pearls, not natural freshwater. |
| Anti **Tarnish** — "**Proprietary shielding** that blocks air oxidation" — _Active Lifetime_ | Anti-**Tarnish** — "Protective coating that keeps the shine for longer" — _Lasting Shine_ | Drops invented "proprietary shielding"; honest about what a coating does. |
| Vintage Oxidised — "**Handcrafted** antiqued detailing…" | Oxidised — "Antique-finish silver-tone with heritage depth" | Removes unverified "handcrafted". |
| Silver Tone — "Bright, modern **cool-spectrum premium** finish" | Silver Tone — "Bright, cool-toned modern finish" | Plain language. |
| Section eyebrow: "Craftsmanship **Durability**" | "Made to Last" | Reads cleanly. |

**Occasions** (minor jargon fixes): "crescent alignments for celebration" → "festive sparkle for every celebration"; "Pre-boxed selections to show thoughtfulness" → "Thoughtful, gift-ready picks they'll love to open"; "Curated stacking packs… multi-pierce ear" → "Coordinated multi-pair sets at one easy price".

### "The Smart Alternative" comparison (`components/AlternativeSection.tsx`)

This was the single most over-claimed block.

| Element | Before | After |
|---|---|---|
| Heading | "Why pay too much for solid gold or settle for cheap **green-turn brass**?" | "Why overpay for solid gold — or risk cheap brass that turns your ears green?" |
| Pearl Bloom card — title | "Anti-Tarnish **Triple Coats**" | "Anti-Tarnish & Skin-Safe" |
| Pearl Bloom card — body | "Honestly priced at **₹153 to ₹399**. Utilizing **medical-grade stainless steel** base stems, wrapped in **heavy gold protective plating** & sealed water-safe." | "Most pieces under ₹499 (sets under ₹999). Skin-safe alloy, copper and steel bases with gold-tone plating and an anti-tarnish coating — light, hypoallergenic and water-resistant for daily wear." |
| Pearl Bloom card — footer | "Cost-Per-Wear: **under ₹1/day**" | "Cost-per-wear: about ₹1 a day" |
| Cheap-brass card | "…triggers **severe** skin itching… revealing **toxic lead/nickel**…" | "…cheap alloys **can** irritate skin and peel within weeks — leaving the nickel underneath that turns earlobes green." (softened, category-level) |
| Pure-gold card | "…results in massive lost effort." | "…one loss down a drain or in a gym locker is a costly one." |

**Why:** removed the fabricated exact price, "medical-grade steel", "heavy gold protective plating" and "triple coats"; replaced with the real materials and the owner-confirmed price bands. Competitor claims softened from absolute ("toxic", "severe") to measured, category-level statements.

### Category & Offers strips (`app/page.tsx`)

| Element | Before | After |
|---|---|---|
| Shop-by-Category intro | "Explore our carefully curated collections, each designed to complement your unique style." | "Find your next favourite pair, grouped the way you like to shop." |
| Offers intro | "Exclusive deals curated just for you. Apply at checkout." | "Real savings on real pieces. Apply the code at checkout." _(Offers section only renders when real offers exist in Firestore — currently dormant.)_ |

### Footer (`components/Footer.tsx`)

| Element | Before | After |
|---|---|---|
| Default brand line | "Exquisite **jewelry** designed for everyday elegance." (US spelling, generic) | "Skin-safe, anti-tarnish artificial earrings for every day — gold-tone shine, honestly priced." |

_Note: this is the **fallback** text. The live brand line comes from Firestore `siteSettings`. Update it there too so the honest version shows in production._

### Product page trust badges (`components/product/TrustBadges.tsx`)

| Element | Before | After |
|---|---|---|
| USP badge | "**Waterproof** — Sweat & splash safe" | "**Water-Resistant** — Sweat & splash safe" |

Touched for consistency: this badge shows on every product page, so a blanket "Waterproof" claim is exactly the kind we are removing. (The shipping/returns/COD row already shows **only real, configured values** — good, left as-is.)

---

## 3. Over-claims fixed (checklist)

- [x] "medical-grade stainless steel" — removed
- [x] "heavy gold protective plating" / "thick micro-plating" — removed
- [x] "18K Gold Plated" label → "Gold Plated"
- [x] Invented price "₹153 to ₹399" → honest bands ("under ₹499 / sets under ₹999")
- [x] "100% tarnish-resistant" → "anti-tarnish"
- [x] "Waterproof" (blanket) → "Water-Resistant / sweat & splash safe" (homepage hero, finishes, PDP badge)
- [x] "freshwater / organic / baroque pearls" → "faux & shell pearls"
- [x] "Triple Coats" / "Proprietary shielding" — removed
- [x] "handcraft / handcrafted" — removed (unverified)
- [x] "toxic lead", "severe" (competitor) — softened to measured, category-level claims
- [x] No fabricated ratings/review counts introduced; existing social proof stays gated

---

## 4. Over-claims still present — needs your action (NOT fixable in a copy pass)

These live in **data or in non-homepage areas**. Flagging, not changing, per the brief.

1. **Live product titles & descriptions (Firestore / admin).** The homepage now pulls product names from the database. If any live product is titled like "18K Gold…", "Diamond…", "Solid…", or describes "real diamond / freshwater pearl", it will still show those words on cards and PDPs. **Action:** audit products in the admin and rename to "gold-plated / gold-tone", "CZ / American Diamond (simulant)", "faux pearl", etc.
2. **`data/catalog.json` fallback is fake luxury data.** It contains template items like an "18K White Gold" "Solitaire Diamond Ring" at ₹1,59,999. It is only used if Firestore fails — but if that happens, the site would display ₹1.6-lakh solid-gold diamond rings. **Action (recommend P0):** replace it with an empty array or a few real earrings so the fallback is safe and on-brand. _(I can do this on your say-so — it's data, not copy, so I left it.)_
3. **"Waterproof" still used in navigation + SEO.** The homepage now says "Water-Resistant", but the catalog mega-menu ("Waterproof Earrings") and the `/earrings/finish/waterproof` SEO page still say "Waterproof". They match each other, so it's consistent for now. **Action:** decide whether to align the whole "waterproof" route to "water-resistant" sitewide.
4. **Footer newsletter form is decorative.** The `<form>` in the footer has no submit handler — it collects nothing. **Action:** wire it to the existing working `SubscriptionForm` component (it already posts to `/api/subscribe`).

---

## 5. Prioritised Trust & Conversion gap list

Ordered by impact on the brand's three golden rules: **(1) show it on the ear, (2) prove the promise, (3) remove the risk.**

### P0 — Honesty & trust blockers (do first)
- **Neutralise the fake `catalog.json` fallback** (see §4.2). A single Firestore hiccup currently risks showing fabricated luxury jewellery.
- **Audit live product data for over-claims** (see §4.1). Component copy is honest now; the database is the remaining surface.
- **Stand up a real review-collection loop.** The review section and hero rating are correctly hidden until real reviews exist — which means there is currently **zero** social proof on site. Highest-leverage trust fix: a post-purchase WhatsApp/email ask that feeds `getRecentReviews` / `getGlobalReviewSummary`. Until then, keep them hidden — do not fabricate.

### P1 — High-impact conversion
- **Replace AI/model imagery with real on-ear photos** (golden rule #1). Shoppers' biggest doubt is "what will it actually look like on me." Real, unretouched on-ear shots beat any copy. Caption honestly (see `copy-assets.md`).
- **Surface risk-reversal above the fold and near add-to-cart** (golden rule #3): returns window, COD, exchange — pulling the **real** values already in app config (the PDP `TrustBadges` logistics row does this; reuse a compact version on the homepage/hero).
- **Wire the footer email capture** (see §4.4) so interest is actually captured.
- **Out-of-stock handling in "Just In".** `NewArrivalsSection` sorts by newest with **no in-stock filter**, so a sold-out item can headline the page. Either filter sold-out or show a clear "Sold out / Notify me" badge.
- **Add an FAQ for the 8 pain points** (skin reaction, tarnishing, weight/comfort, water exposure, sizing, care, shipping time, returns). Doubles as SEO and objection-handling. Empathy microcopy for each is in `copy-assets.md`.

### P2 — Brand depth & honest urgency
- **Real "About / brand story" + real contact details.** Contact email/phone only render if set in Firestore `siteSettings` — set them. A short, honest founder/brand story builds trust for a young label.
- **Honest urgency only.** If you want urgency, drive it from **real** inventory ("Only 3 left") — never fake countdown timers or invented "1,420 buyers".
- **Quantified guarantee** (e.g., "X-day easy returns", "anti-tarnish promise") in an announcement bar or hero — but only once the policy is confirmed and the number is real.
- **Decide the sitewide "waterproof → water-resistant" alignment** (see §4.3).

---

## 6. What stayed hidden on purpose (do not "fix" by faking)

- **Hero social-proof block** — gated behind `SHOW_SOCIAL_PROOF = false`. Turn on only when real avatars/rating/buyer-count exist.
- **Reviews section** — returns `null` while `summary.count === 0`. Correct. It will appear automatically when real reviews land.

These are the right calls. The conversion lift comes from collecting **real** proof (P0), not from switching on placeholders.
