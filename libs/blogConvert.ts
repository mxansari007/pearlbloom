import type { BlogPost } from "../content/blog/types";
import type { Para, Segment } from "../content/shared";

/** The Firestore/admin blog document shape (authored in the admin Journal). */
export type BlogDoc = {
  slug: string;
  title: string; // page H1
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  kind: "pillar" | "focused" | "post";
  heroImage: { url: string; public_id?: string; alt: string } | null;
  bodyHtml: string;
  faqs: { q: string; a: string }[];
  related: { label: string; href: string }[];
  status: "draft" | "published";
  datePublished: string;
  dateModified?: string;
  readMins: number;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPara(p: Para): string {
  if (typeof p === "string") return esc(p);
  return p
    .map((seg: Segment) =>
      typeof seg === "string" ? esc(seg) : `<a href="${esc(seg.href)}">${esc(seg.text)}</a>`
    )
    .join("");
}

/** Serialize a structured BlogPost (intro + sections + subsections) into body HTML. */
export function blogPostToHtml(post: BlogPost): string {
  const parts: string[] = [];
  post.intro.forEach((p) => parts.push(`<p>${renderPara(p)}</p>`));
  post.sections.forEach((s) => {
    parts.push(`<h2>${esc(s.h2)}</h2>`);
    s.body.forEach((p) => parts.push(`<p>${renderPara(p)}</p>`));
    (s.subsections ?? []).forEach((sub) => {
      parts.push(`<h3>${esc(sub.h3)}</h3>`);
      sub.body.forEach((p) => parts.push(`<p>${renderPara(p)}</p>`));
    });
  });
  return parts.join("\n");
}

/** Convert a legacy code-authored post into the Firestore/admin document shape. */
export function blogPostToDoc(post: BlogPost): BlogDoc {
  return {
    slug: post.slug,
    title: post.h1,
    metaTitle: post.title,
    metaDescription: post.metaDescription,
    excerpt: post.excerpt,
    kind: post.kind,
    heroImage: null,
    bodyHtml: blogPostToHtml(post),
    faqs: post.faqs,
    related: post.related,
    status: "published",
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    readMins: post.readMins,
  };
}
