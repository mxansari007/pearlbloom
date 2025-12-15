// src/lib/products.ts
import { dbAdmin } from "./firebase-admin";
import type {
  Product,
  ProductAttribute,
  Marketplaces,
} from "../types/products";

function normalizeAttributes(data: any): ProductAttribute[] {
  const attrs: ProductAttribute[] = Array.isArray(data.attributes)
    ? data.attributes
    : [];

  const addIfMissing = (key: string, value?: string) => {
    if (!value) return;
    const exists = attrs.some(
      (a) => a.key.toLowerCase() === key.toLowerCase()
    );
    if (!exists) {
      attrs.push({ key, value });
    }
  };

  // migrate legacy fields into attributes if present
  addIfMissing("Metal", data.metal);
  addIfMissing("Gemstone", data.gemstone);
  addIfMissing("SKU", data.sku);

  return attrs;
}

function mapProductDoc(doc: FirebaseFirestore.DocumentSnapshot): Product {
  const data = doc.data() as any;

  const title: string = data.title ?? data.name ?? "";
  const images: string[] = Array.isArray(data.images) ? data.images : [];
  const attributes = normalizeAttributes(data);

  const marketplaces: Marketplaces | undefined = data.marketplaces
    ? {
        amazon: data.marketplaces.amazon,
        flipkart: data.marketplaces.flipkart,
        meesho: data.marketplaces.meesho,
      }
    : undefined;

  return {
    id: doc.id,
    title,
    slug: data.slug ?? "",
    price: typeof data.price === "number" ? data.price : undefined,
    currency: data.currency ?? "INR",

    description: data.description ?? data.fullDescription ?? "",
    shortDescription: data.shortDescription ?? "",

    thumbnailUrl: data.thumbnailUrl ?? images[0],
    images,

    brand: data.brand ?? "",
    categories: Array.isArray(data.categories) ? data.categories : [],
    collectionId: data.collectionId ?? "",
    isFeatured: !!data.isFeatured,

    attributes,

    // legacy fields kept for backward compatibility
    metal: data.metal,
    gemstone: data.gemstone,
    sku: data.sku,

    marketplaces,
  };
}

// ──────────────────────────
// Public API
// ──────────────────────────

export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  const snap = await dbAdmin
    .collection("products")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return mapProductDoc(snap.docs[0]);
}

export async function getFeaturedProducts(
  limit = 6
): Promise<Product[]> {
  const snap = await dbAdmin
    .collection("products")
    .where("isFeatured", "==", true)
    .limit(limit)
    .get();

  return snap.docs.map(mapProductDoc);
}

export async function getAllProducts(): Promise<Product[]> {
  const snap = await dbAdmin.collection("products").get();
  return snap.docs.map(mapProductDoc);
}

export async function getProductsByIds(
  ids: string[]
): Promise<Product[]> {
  if (!ids.length) return [];
  const snaps = await Promise.all(
    ids.map((id) => dbAdmin.collection("products").doc(id).get())
  );
  return snaps.filter((d) => d.exists).map(mapProductDoc);
}

export async function getAllSlugs(): Promise<string[]> {
  const snap = await dbAdmin.collection("products").select("slug").get();
  return snap.docs
    .map((d) => (d.data() as any).slug)
    .filter(Boolean) as string[];
}
