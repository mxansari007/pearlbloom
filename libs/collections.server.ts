import { dbAdmin } from "./firebase-admin";
import { serializeFirestore } from "./serialize";
import type { Collection } from "@/types/collections";


/* ----------------------------------
   Get all collections (cached)
----------------------------------- */
export const getAllCollections = async (): Promise<Collection[]> => {
    const snap = await dbAdmin.collection("collections").get();

    return snap.docs.map((d) =>
      serializeFirestore({
        id: d.id,
        ...(d.data() as Omit<Collection, "id">),
      })
    );
  }

/* ----------------------------------
   Get collections by IDs (cached)
----------------------------------- */
export const getCollectionsByIds = async (ids: string[]): Promise<Collection[]> => {
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
  };

/* ----------------------------------
   Get collection by slug (cached)
----------------------------------- */
export const getCollectionBySlug = async (slug: string): Promise<Collection | null> => {
    if (!slug) return null;

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
  }
