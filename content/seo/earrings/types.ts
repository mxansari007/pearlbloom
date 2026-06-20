import type { Para, FaqItem, InternalLink } from "../../shared";

/* ------------------------------------------------------------------
   SEO content for a single earrings collection page (style / finish /
   occasion facet, or the All Earrings hub). Joined to the taxonomy in
   libs/earringCategories.ts by `${type}/${slug}`.
------------------------------------------------------------------- */
export type CollectionSeo = {
  /** <title> — unique, primary keyword front-loaded, ≤60 chars. */
  metaTitle: string;
  /** <meta name="description"> — unique, 140–155 chars, benefit-led. */
  metaDescription: string;
  /** One primary keyword for the page. */
  primaryKeyword: string;
  /** 2–4 supporting keywords used naturally in the copy. */
  secondaryKeywords: string[];
  /** Visible <h1> — keyword-led, distinct from metaTitle. */
  h1: string;
  /** Short one-line lede shown in the page header (distinct from intro + meta). */
  lede: string;
  /** Rich intro paragraphs (with inline internal links). Tier 1: 300–450 words, Tier 2: 150–250. */
  intro: Para[];
  /** Contextual related-collection links rendered as a block. */
  internalLinks: InternalLink[];
  /** Page-specific FAQs — Tier 1: 5–6, Tier 2: 4. Rendered + emitted as FAQPage JSON-LD. */
  faqs: FaqItem[];
  /** Accessible alt text suggestion for the collection hero image. */
  heroAlt: string;
  /** Slug of the pillar/focused blog this page links up to. */
  assignedBlog: string;
  /** Content tier (1 = full unique build, 2 = lean build). */
  tier: 1 | 2;
  /** Admin override: when true, the page is excluded from search indexing. */
  noindex?: boolean;
};

export type CollectionSeoMap = Record<string, CollectionSeo>;
