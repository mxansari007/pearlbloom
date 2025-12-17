import { unstable_noStore as noStore } from "next/cache";

import { dbAdmin } from "./firebase-admin";
import { serializeFirestore } from "./serialize";
import type { Collection } from "@/types/collections";

/* ----------------------------------
   Get all collections
----------------------------------- */

noStore();

export async function getAllCollections(): Promise<Collection[]> {
  const snap = await dbAdmin.collection("collections").get();

  return snap.docs.map((d) =>
    serializeFirestore({
      id: d.id,
      ...(d.data() as Omit<Collection, "id">),
    })
  );
}

/* ----------------------------------
   Get collections by IDs
----------------------------------- */
export async function getCollectionsByIds(
  ids: string[]
): Promise<Collection[]> {
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
}
