import type { Para, FaqItem, InternalLink } from "../shared";

/** A subsection (H3) within a blog section. */
export type BlogSubsection = { h3: string; body: Para[] };

/** A top-level blog section (H2), optionally with H3 subsections. */
export type BlogSection = {
  h2: string;
  body: Para[];
  subsections?: BlogSubsection[];
};

/* ------------------------------------------------------------------
   A blog post authored as a typed content module (no MDX dependency).
   Rendered by components/blog/BlogArticle.tsx with Article + FAQPage +
   BreadcrumbList JSON-LD.
------------------------------------------------------------------- */
export type BlogPost = {
  slug: string;
  /** pillar (900–1500 words, supports a cluster) or focused (600–900 words). */
  kind: "pillar" | "focused";
  /** <title> with brand suffix. */
  title: string;
  /** Visible <h1>. */
  h1: string;
  /** <meta name="description"> — 140–155 chars. */
  metaDescription: string;
  /** Short summary for blog cards + OG. */
  excerpt: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  /** ISO date (YYYY-MM-DD). */
  datePublished: string;
  /** ISO date (YYYY-MM-DD); defaults to datePublished if omitted. */
  dateModified?: string;
  /** Estimated read time in minutes. */
  readMins: number;
  /** Accessible alt text for the article hero. */
  heroAlt: string;
  /** Opening paragraphs. */
  intro: Para[];
  /** Body sections (H2 + optional H3s). */
  sections: BlogSection[];
  /** Short FAQ (emitted as FAQPage JSON-LD). */
  faqs: FaqItem[];
  /** Down-links to the collection pages this post supports. */
  related: InternalLink[];
};
