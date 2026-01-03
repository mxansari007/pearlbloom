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
  Attribute,
} from "../types/products";

/* ---------------- In-memory cache for client-side ---------------- */

const slugToIdCache = new Map<string, string>();
const productCache = new Map<string, { data: Product; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

/* ---------------- Helpers ---------------- */

function normalizeAttributes(data: DocumentData): Attribute[] {
  if (Array.isArray(data.attributes)) {
    return data.attributes;
  }
  return [];
}

function normalizeMarketplaces(data: DocumentData): {
  amazon?: string;
  flipkart?: string;
  meesho?: string;
} {
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

  // Flags
  isFeatured: Boolean(data.isFeatured),

  // Attributes
  attributes: normalizeAttributes(data),

  // Marketplaces (ALWAYS PRESENT)
  marketplaces: normalizeMarketplaces(data),

  // Inventory policy (defaults)
  inventoryPolicy: {
    trackStock: Boolean(data?.inventoryPolicy?.trackStock),
    allowBackorder: Boolean(data?.inventoryPolicy?.allowBackorder),
  },

  inventory: data.inventory ? {
    discountPercent: typeof data.inventory.discountPercent === "number" ? data.inventory.discountPercent : 0,
  } : undefined,

  // Variants (ensure array)
  variants: Array.isArray(data?.variants) ? data.variants : [],

  // Timestamps
  createdAt: typeof data?.createdAt === "string"
    ? data.createdAt
    : new Date().toISOString(),
  updatedAt: typeof data?.updatedAt === "string"
    ? data.updatedAt
    : new Date().toISOString(),
  };
}

function cacheProduct(product: Product): void {
  productCache.set(product.id, { data: product, timestamp: Date.now() });
  if (product.slug) {
    slugToIdCache.set(product.slug, product.id);
  }
}

/* ---------------- Public API ---------------- */

export async function getProductById(id: string): Promise<Product | null> {
  // Check cache first
  const cached = productCache.get(id);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  const docRef = doc(dbClient, "products", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const product = mapProductDoc(docSnap as QueryDocumentSnapshot<DocumentData>);
  cacheProduct(product);

  return product;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Check slug-to-ID cache first
  const cachedId = slugToIdCache.get(slug);
  if (cachedId) {
    const cached = productCache.get(cachedId);
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    // Try direct lookup with cached ID
    return getProductById(cachedId);
  }

  // Fallback to query
  const q = query(
    collection(dbClient, "products"),
    where("slug", "==", slug),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const product = mapProductDoc(snap.docs[0]);
  cacheProduct(product);

  return product;
}

export async function getFeaturedProducts(max = 6): Promise<Product[]> {
  const q = query(
    collection(dbClient, "products"),
    where("isFeatured", "==", true),
    limit(max)
  );

  const snap = await getDocs(q);
  const products = snap.docs.map(mapProductDoc);

  // Cache products while we're at it
  products.forEach(cacheProduct);

  return products;
}

export async function getAllProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(dbClient, "products"));
  const products = snap.docs.map(mapProductDoc);

  // Cache products while we're at it
  products.forEach(cacheProduct);

  return products;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];

  const results: Product[] = [];
  const uncachedIds: string[] = [];

  // Check cache first
  for (const id of ids) {
    const cached = productCache.get(id);
    if (cached && isCacheValid(cached.timestamp)) {
      results.push(cached.data);
    } else {
      uncachedIds.push(id);
    }
  }

  // Fetch uncached
  if (uncachedIds.length > 0) {
    const snaps = await Promise.all(
      uncachedIds.map(async (id) => {
        const d = await getDoc(doc(dbClient, "products", id));
        return d.exists() ? d : null;
      })
    );

    for (const snap of snaps) {
      if (snap) {
        const product = mapProductDoc(snap as QueryDocumentSnapshot<DocumentData>);
        results.push(product);
        cacheProduct(product);
      }
    }
  }

  return results;
}

export async function getAllSlugs(): Promise<string[]> {
  const snap = await getDocs(collection(dbClient, "products"));
  return snap.docs
    .map((d) => d.data().slug)
    .filter((s): s is string => Boolean(s));
}
