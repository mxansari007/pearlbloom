import { cache } from "react";
import { unstable_cache } from "next/cache";
import { dbAdmin } from "./firebase-admin";
import { serializeFirestore } from "./serialize";
import type { Collection } from "@/types/collections";

/* ----------------------------------
   Slug-to-ID Cache (5 minute cache)
   Reduces repeated slug queries
----------------------------------- */
const getCollectionIdBySlugCached = unstable_cache(
  async (slug: string): Promise<string | null> => {
    try {
      const snap = await dbAdmin
        .collection("collections")
        .where("slug", "==", slug)
        .select() // Only fetch document reference, not data
        .limit(1)
        .get();

      if (snap.empty) return null;
      return snap.docs[0].id;
    } catch (error) {
      console.error("getCollectionIdBySlug failed:", error);
      return null;
    }
  },
  ["collection-slug-to-id"],
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

export const getAllCollections = unstable_cache(
  getAllCollectionsRaw,
  ["all-collections"],
  { revalidate: 60, tags: ["collections"] }
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
  try {
    if (!slug) return null;

    // First try the cached slug-to-ID mapping
    const collectionId = await getCollectionIdBySlugCached(slug);
    
    if (collectionId) {
      // Direct document lookup - only 1 read
      return await getCollectionById(collectionId);
    }

    // Fallback: query by slug (if cache miss or new collection)
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
    console.error("getCollectionBySlug failed:", error);
    return null;
  }
};

// React cache() for request deduplication - multiple calls in same request = 1 fetch
export const getCollectionBySlug = cache(getCollectionBySlugRaw);
