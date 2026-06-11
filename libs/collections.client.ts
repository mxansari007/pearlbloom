// src/libs/collections.client.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { dbClient } from "./firebase-client";
// Use the shared Collection type so client and server agree on the shape.
// The local copy was missing `priority`/`isFeatured` (which navigation relies
// on), so mapping a doc through it silently dropped those fields.
import type { Collection } from "@/types/collections";

/* ---------------- Types ---------------- */

export type { Collection };

/* ---------------- In-memory cache for client-side ---------------- */

const slugToIdCache = new Map<string, string>();
const collectionCache = new Map<string, { data: Collection; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

/* ---------------- Get collection by ID (direct lookup) ---------------- */

export async function getCollectionById(id: string): Promise<Collection | null> {
  // Check cache first
  const cached = collectionCache.get(id);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const docRef = doc(dbClient, "collections", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  const collection: Collection = {
    id: docSnap.id,
    name: data.name ?? "",
    slug: data.slug ?? "",
    description: data.description,
    thumbnail: data.thumbnail,
  };

  // Cache the result
  collectionCache.set(id, { data: collection, timestamp: Date.now() });
  if (collection.slug) {
    slugToIdCache.set(collection.slug, id);
  }

  return collection;
}

/* ---------------- Get collection by slug (optimized) ---------------- */

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  if (!slug) return null;

  // Check slug-to-ID cache first
  const cachedId = slugToIdCache.get(slug);
  if (cachedId) {
    const cached = collectionCache.get(cachedId);
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    // Try direct lookup with cached ID
    return getCollectionById(cachedId);
  }

  // Fallback to query
  const q = query(
    collection(dbClient, "collections"),
    where("slug", "==", slug),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  const data = docSnap.data();
  const result: Collection = {
    id: docSnap.id,
    name: data.name ?? "",
    slug: data.slug ?? "",
    description: data.description,
    thumbnail: data.thumbnail,
  };

  // Cache results
  slugToIdCache.set(slug, result.id);
  collectionCache.set(result.id, { data: result, timestamp: Date.now() });

  return result;
}

/* ---------------- Get collections by IDs (batch) ---------------- */

export async function getCollectionsByIds(ids: string[]): Promise<Collection[]> {
  if (!ids.length) return [];

  const results: Collection[] = [];
  const uncachedIds: string[] = [];

  // Check cache first
  for (const id of ids) {
    const cached = collectionCache.get(id);
    if (cached && isCacheValid(cached.timestamp)) {
      results.push(cached.data);
    } else {
      uncachedIds.push(id);
    }
  }

  // Fetch uncached
  if (uncachedIds.length > 0) {
    const snaps = await Promise.all(
      uncachedIds.map((id) => getDoc(doc(dbClient, "collections", id)))
    );

    for (const snap of snaps) {
      if (snap.exists()) {
        const data = snap.data();
        const coll: Collection = {
          id: snap.id,
          name: data.name ?? "",
          slug: data.slug ?? "",
          description: data.description,
          thumbnail: data.thumbnail,
        };
        results.push(coll);
        collectionCache.set(coll.id, { data: coll, timestamp: Date.now() });
        if (coll.slug) {
          slugToIdCache.set(coll.slug, coll.id);
        }
      }
    }
  }

  return results;
}

/* ---------------- Get all collections ---------------- */

export async function getAllCollections(): Promise<Collection[]> {
  const snap = await getDocs(collection(dbClient, "collections"));

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    const coll: Collection = {
      id: docSnap.id,
      name: data.name ?? "",
      slug: data.slug ?? "",
      description: data.description,
      thumbnail: data.thumbnail,
    };

    // Cache while we're at it
    collectionCache.set(coll.id, { data: coll, timestamp: Date.now() });
    if (coll.slug) {
      slugToIdCache.set(coll.slug, coll.id);
    }

    return coll;
  });
}
