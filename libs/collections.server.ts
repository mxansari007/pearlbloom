import { cache } from "react";
import { unstable_cache } from "next/cache";
import { dbAdmin } from "./firebase-admin";
import { serializeFirestore } from "./serialize";
import type { Collection } from "@/types/collections";

/* ----------------------------------
   Slug → collection (single cached query, 5 minute cache)
   One where-query per slug. On a hit the full document is already in the
   cache (no extra doc read); on a miss the cached null avoids re-querying.
   This replaces the old select()-only id cache + live fallback, which ran
   the same slug query twice on a true miss.
----------------------------------- */
const getCollectionBySlugQueryCached = unstable_cache(
  async (slug: string): Promise<Collection | null> => {
    try {
      const snap = await dbAdmin
        .collection("collections")
        .where("slug", "==", slug)
        .limit(1)
        .get();

      if (snap.empty) return null;

      const doc = snap.docs[0];
      return serializeFirestore({
        id: doc.id,
        ...(doc.data() as Omit<Collection, "id">),
      });
    } catch (error) {
      console.error("getCollectionBySlugQuery failed:", error);
      return null;
    }
  },
  ["collection-by-slug"],
  { revalidate: 300, tags: ["collections"] }
);

/* ----------------------------------
   Get collection by ID (direct lookup - 1 read)
----------------------------------- */
const getCollectionByIdRaw = async (id: string): Promise<Collection | null> => {
  try {
    const doc = await dbAdmin.collection("collections").doc(id).get();
    if (!doc.exists) return null;

    return serializeFirestore({
      id: doc.id,
      ...(doc.data() as Omit<Collection, "id">),
    });
  } catch (error) {
    console.error("getCollectionById failed:", error);
    return null;
  }
};

// React cache() deduplicates within same request
export const getCollectionById = cache(getCollectionByIdRaw);

/* ----------------------------------
   Get all collections (cached cross-request)
----------------------------------- */
const getAllCollectionsRaw = async (): Promise<Collection[]> => {
  try {
    const snap = await dbAdmin.collection("collections").get();

    return snap.docs.map((d) =>
      serializeFirestore({
        id: d.id,
        ...(d.data() as Omit<Collection, "id">),
      })
    );
  } catch (error) {
    console.error("getAllCollections failed:", error);
    return [];
  }
};

// Nav reads the whole collection list; collections change rarely, so cache it
// for 5 minutes (tag-busted on writes) rather than re-scanning every minute.
export const getAllCollections = unstable_cache(
  getAllCollectionsRaw,
  ["all-collections"],
  { revalidate: 300, tags: ["collections"] }
);

/* ----------------------------------
   Get collections by IDs (request-deduplicated)
----------------------------------- */
export const getCollectionsByIds = cache(async (ids: string[]): Promise<Collection[]> => {
  try {
    if (!ids.length) return [];

    const snaps = await Promise.all(
      ids.map((id) => dbAdmin.collection("collections").doc(id).get())
    );

    return snaps
      .filter((d) => d.exists)
      .map((d) =>
        serializeFirestore({
          id: d.id,
          ...(d.data() as Omit<Collection, "id">),
        })
      );
  } catch (error) {
    console.error("getCollectionsByIds failed:", error);
    return [];
  }
});

/* ----------------------------------
   Get collection by slug (optimized)
   1. Check slug-to-ID cache (cached, no read if hit)
   2. Fetch by ID (1 read, deduplicated within request)
----------------------------------- */
const getCollectionBySlugRaw = async (slug: string): Promise<Collection | null> => {
  if (!slug) return null;
  return getCollectionBySlugQueryCached(slug);
};

// React cache() for request deduplication - multiple calls in same request = 1 fetch
export const getCollectionBySlug = cache(getCollectionBySlugRaw);
