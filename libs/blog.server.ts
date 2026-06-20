import { cache } from "react";
import { dbAdmin } from "./firebase-admin";
import type { BlogDoc } from "./blogConvert";
import { blogPostToDoc } from "./blogConvert";
import { getAllPosts as getLegacyPosts } from "../content/blog";

/** Legacy code-authored posts converted to the unified BlogDoc shape (fallback). */
function legacyDocs(): BlogDoc[] {
  return getLegacyPosts().map(blogPostToDoc);
}

const readDbPosts = cache(async (): Promise<BlogDoc[]> => {
  try {
    const snap = await dbAdmin.collection("blogPosts").get();
    return snap.docs.map((d) => {
      const data = d.data() as Partial<BlogDoc>;
      return { ...(data as BlogDoc), slug: (data.slug as string) || d.id };
    });
  } catch (error) {
    console.error("readDbPosts failed:", error);
    return [];
  }
});

/**
 * All published posts. The database is the source of truth; legacy code-posts
 * act as a fallback so the Journal is never empty before migration. A DB post
 * overrides the legacy one of the same slug; a DB post set to draft hides it.
 */
export const getAllBlogPosts = cache(async (): Promise<BlogDoc[]> => {
  const db = await readDbPosts();
  const bySlug = new Map<string, BlogDoc>();
  legacyDocs().forEach((p) => bySlug.set(p.slug, p));
  db.forEach((p) => {
    if (p.status === "published") bySlug.set(p.slug, p);
    else bySlug.delete(p.slug); // draft/unpublished hides it (incl. legacy fallback)
  });
  return [...bySlug.values()]
    .filter((p) => p.status === "published")
    .sort((a, b) => ((a.datePublished || "") < (b.datePublished || "") ? 1 : -1));
});

export async function getBlogPost(slug: string): Promise<BlogDoc | null> {
  const all = await getAllBlogPosts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getAllBlogSlugs(): Promise<string[]> {
  return (await getAllBlogPosts()).map((p) => p.slug);
}
