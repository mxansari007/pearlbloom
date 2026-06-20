import type { BlogPost } from "./types";
import typesGuide from "./types-of-earrings-guide";
import careGuide from "./anti-tarnish-waterproof-earrings-care";
import occasionGuide from "./earrings-for-every-occasion";
import finishGuide from "./oxidised-vs-gold-tone-vs-silver-tone";
import ethnicGuide from "./how-to-style-jhumkas-and-chandbalis";
import hoopGuide from "./how-to-style-hoop-earrings-face-shape";
import studGuide from "./stud-earrings-everyday-style-guide";
import goldPlatedGuide from "./are-gold-plated-earrings-worth-it";

const POSTS: BlogPost[] = [
  typesGuide,
  careGuide,
  occasionGuide,
  finishGuide,
  ethnicGuide,
  hoopGuide,
  studGuide,
  goldPlatedGuide,
];

const BY_SLUG = new Map<string, BlogPost>(POSTS.map((p) => [p.slug, p]));

/** All posts, newest first (ISO date strings sort lexicographically). */
export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.datePublished < b.datePublished ? 1 : -1));
}

export function getPost(slug: string): BlogPost | null {
  return BY_SLUG.get(slug) ?? null;
}

/** Resolve a post slug to its route + display title (for "go deeper" up-links). */
export function getBlogLink(slug: string): { href: string; title: string } | null {
  const p = BY_SLUG.get(slug);
  return p ? { href: `/blog/${slug}`, title: p.h1 } : null;
}

export type { BlogPost };
