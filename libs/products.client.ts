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
  if (Array.isArray(data.attributes)) {
    return data.attributes;
  }
  return [];
}

function normalizeMarketplaces(data: any): Marketplaces {
  return {
    amazon: data?.marketplaces?.amazon || "",
    flipkart: data?.marketplaces?.flipkart || "",
    meesho: data?.marketplaces?.meesho || "",
  };
}

function mapProductDoc(
  docSnap: QueryDocumentSnapshot<DocumentData>
): Product {
  const data = docSnap.data();

  return {
    id: docSnap.id,

    // Identity
    name: data.name ?? "",
    slug: data.slug ?? "",

    // Pricing
    price: typeof data.price === "number" ? data.price : 0,
    currency: data.currency ?? "INR",

    // Descriptions
    shortDescription: data.shortDescription ?? "",
    description: data.description ?? "",

    // Media
    thumbnailUrl:
      data.thumbnailUrl ??
      (Array.isArray(data.images) ? data.images[0] : "") ??
      "",
    images: Array.isArray(data.images) ? data.images : [],

    // Relations
    brand: data.brand ?? "",
    categories: Array.isArray(data.categories) ? data.categories : [],
    collectionId: data.collectionId ?? "",

    // Flags
    isFeatured: Boolean(data.isFeatured),

    // Attributes
    attributes: normalizeAttributes(data),

    // Marketplaces (ALWAYS PRESENT)
    marketplaces: normalizeMarketplaces(data),
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
    .filter((d): d is QueryDocumentSnapshot<DocumentData> => Boolean(d))
    .map(mapProductDoc);
}

export async function getAllSlugs(): Promise<string[]> {
  const snap = await getDocs(collection(dbClient, "products"));
  return snap.docs
    .map((d) => d.data().slug)
    .filter((s): s is string => Boolean(s));
}
