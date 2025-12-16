import { dbAdmin } from "./firebase-admin";
import { serializeFirestore } from "./serialize";
import type { Product } from "@/types/products";

/* ----------------------------------
   Get products by IDs
----------------------------------- */
export async function getProductsByIds(
  ids: string[]
): Promise<Product[]> {
  if (!ids.length) return [];

  const snaps = await Promise.all(
    ids.map((id) => dbAdmin.collection("products").doc(id).get())
  );

  return snaps
    .filter((d) => d.exists)
    .map((d) =>
      serializeFirestore({
        id: d.id,
        ...(d.data() as Omit<Product, "id">),
      })
    );
}

/* ----------------------------------
   Get product by slug
----------------------------------- */
export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  const snap = await dbAdmin
    .collection("products")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;

  return serializeFirestore({
    id: snap.docs[0].id,
    ...(snap.docs[0].data() as Omit<Product, "id">),
  });
}

/* ----------------------------------
   Get all products
----------------------------------- */
export async function getAllProducts(): Promise<Product[]> {
  const snap = await dbAdmin.collection("products").get();

  return snap.docs.map((d) =>
    serializeFirestore({
      id: d.id,
      ...(d.data() as Omit<Product, "id">),
    })
  );
}

/* ----------------------------------
   Get featured products
----------------------------------- */
export async function getFeaturedProducts(
  limit = 6
): Promise<Product[]> {
  const snap = await dbAdmin
    .collection("products")
    .where("isFeatured", "==", true)
    .limit(limit)
    .get();

  return snap.docs.map((d) =>
    serializeFirestore({
      id: d.id,
      ...(d.data() as Omit<Product, "id">),
    })
  );
}

/* ----------------------------------
   Get all slugs
----------------------------------- */
export async function getAllSlugs(): Promise<string[]> {
  const snap = await dbAdmin
    .collection("products")
    .select("slug")
    .get();

  return snap.docs
    .map((d) => (d.data() as any).slug)
    .filter(Boolean);
}
