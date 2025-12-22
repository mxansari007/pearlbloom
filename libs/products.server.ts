import { dbAdmin } from "./firebase-admin";
import { serializeFirestore } from "./serialize";
import type { Product } from "@/types/products";


const PAGE_SIZE = 8;

/* ----------------------------------
   Get ALL products (cached)
----------------------------------- */
export const getAllProducts = async (): Promise<Product[]> => {
    const snap = await dbAdmin.collection("products").get();

    return snap.docs.map((d) =>
      serializeFirestore({
        id: d.id,
        ...(d.data() as Omit<Product, "id">),
      })
    );
  }

/* ----------------------------------
   Get product by slug (cached)
----------------------------------- */
export const getProductBySlug = async (slug: string): Promise<Product | null> => {
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
   Get products by IDs (cached)
----------------------------------- */
export const getProductsByIds = async (ids: string[]): Promise<Product[]> => {
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
   Get featured products (cached)
----------------------------------- */
export const getFeaturedProducts = async (limit = 6): Promise<Product[]> => {
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
   Get all slugs (cached)
----------------------------------- */
export const getAllSlugs = async (): Promise<string[]> => {
    const snap = await dbAdmin
      .collection("products")
      .select("slug")
      .get();

    return snap.docs
      .map((d) => (d.data() as any).slug)
      .filter(Boolean);
  }



/* ----------------------------------
   Get products by collection (paginated)
----------------------------------- */
export async function getProductsByCollectionId(
  collectionId: string,
  cursor?: string
) {
  // ⛔ pagination should stay dynamic
  // This is OK — not used on initial navigation
  try {
    let query = dbAdmin
      .collection("products")
      .where("collectionId", "==", collectionId)
      .orderBy("createdAt", "desc")
      .limit(PAGE_SIZE);

    if (cursor) {
      const lastDoc = await dbAdmin.collection("products").doc(cursor).get();
      if (lastDoc.exists) query = query.startAfter(lastDoc);
    }

    const snap = await query.get();

    const products = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));

    const nextCursor =
      snap.docs.length === PAGE_SIZE
        ? snap.docs[snap.docs.length - 1].id
        : null;

    return {
      products: serializeFirestore(products),
      nextCursor,
    };
  } catch (error) {
    console.error("❌ getProductsByCollectionId failed:", error);
    return { products: [], nextCursor: null };
  }
}
