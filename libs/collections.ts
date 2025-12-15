// src/libs/collections.ts
import { dbAdmin } from "./firebase-admin";

/* ---------------- Types ---------------- */

export type Collection = {
  id: string;
  name: string;
  slug: string;
  thumbnail?: {
    url: string;
    public_id: string;
  };
};

/* ---------------- Fetch collections ---------------- */

export async function getCollectionsByIds(
  ids: string[]
): Promise<Collection[]> {
  if (!ids.length) return [];

  const snaps = await Promise.all(
    ids.map((id) =>
      dbAdmin
        .collection("collections")
        .doc(id)
        .get()
    )
  );

  return snaps
    .filter((snap) => snap.exists)
    .map((snap) => ({
      id: snap.id,
      ...(snap.data() as Omit<Collection, "id">),
    }));
}
