/* ------------------------------------------------------------------
   Shared content primitives for the SEO content layer + blog.
   Plain types (no imports) so any client/server module can use them.
------------------------------------------------------------------- */

/** An inline link inside a paragraph. */
export type LinkSegment = { text: string; href: string };

/** A piece of a paragraph: plain text or an inline link. */
export type Segment = string | LinkSegment;

/** A paragraph: either a plain string or a sequence of segments (for inline links). */
export type Para = string | Segment[];

/** A question/answer pair. Answers are plain text (kept clean for FAQPage JSON-LD). */
export type FaqItem = { q: string; a: string };

/** A contextual internal link shown in a "related collections" block. */
export type InternalLink = { label: string; href: string };
