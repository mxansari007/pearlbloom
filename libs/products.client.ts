// src/lib/products.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { dbClient } from "./firebase-client";

import type {
  Product,
  ProductAttribute,
  Marketplaces,
} from "../types/products";

/* ---------------- Helpers ---------------- */

function normalizeAttributes(data: any): ProductAttribute[] {
  const attrs: ProductAttribute[] = Array.isArray(data.attributes)
    ? [...data.attributes]
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

  addIfMissing("Metal", data.metal);
  addIfMissing("Gemstone", data.gemstone);
  addIfMissing("SKU", data.sku);

  return attrs;
}

function mapProductDoc(
  docSnap: QueryDocumentSnapshot<DocumentData>
): Product {
  const data = docSnap.data();

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
    id: docSnap.id,
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
    isFeatured: Boolean(data.isFeatured),

    attributes,

    // legacy
    metal: data.metal,
    gemstone: data.gemstone,
    sku: data.sku,

    marketplaces,
  };
}

/* ---------------- Public API ---------------- */

export async function getProductBySlug(
  slug: string
): Promise<Product | null> {
  const q = query(
    collection(dbClient, "products"),
    where("slug", "==", slug),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  return mapProductDoc(snap.docs[0]);
}

export async function getFeaturedProducts(
  max = 6
): Promise<Product[]> {
  const q = query(
    collection(dbClient, "products"),
    where("isFeatured", "==", true),
    limit(max)
  );

  const snap = await getDocs(q);
  return snap.docs.map(mapProductDoc);
}

export async function getAllProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(dbClient, "products"));
  return snap.docs.map(mapProductDoc);
}

export async function getProductsByIds(
  ids: string[]
): Promise<Product[]> {
  if (!ids.length) return [];

  const snaps = await Promise.all(
    ids.map(async (id) => {
      const d = await getDoc(doc(dbClient, "products", id));
      return d.exists() ? d : null;
    })
  );

  return snaps
    .filter(Boolean)
    .map((d) => mapProductDoc(d!));
}

export async function getAllSlugs(): Promise<string[]> {
  const snap = await getDocs(
    query(collection(dbClient, "products"))
  );

  return snap.docs
    .map((d) => d.data().slug)
    .filter(Boolean);
}
