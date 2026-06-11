import { cache } from "react";
import { unstable_cache } from "next/cache";
import { dbAdmin } from "./firebase-admin";
import { serializeFirestore } from "./serialize";
import type { Product } from "@/types/products";
import { readFile } from "node:fs/promises";
import path from "node:path";

function normalizeVariants(value: unknown): Product["variants"] {
  if (Array.isArray(value)) return value as Product["variants"];
  if (value == null) return [];
  return [value as Product["variants"][number]];
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    variants: normalizeVariants((product as unknown as { variants?: unknown }).variants),
  };
}

const PAGE_SIZE = 8;

type CatalogItem = {
  id?: unknown;
  title?: unknown;
  name?: unknown;
  slug?: unknown;
  price?: unknown;
  description?: unknown;
  images?: unknown;
  brand?: unknown;
  categories?: unknown;
  marketplaces?: unknown;
};

async function readCatalogProducts(): Promise<Product[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "catalog.json");
    const raw = await readFile(filePath, "utf8");
    const json = JSON.parse(raw) as unknown;
    if (!Array.isArray(json)) return [];

    const now = new Date().toISOString();

    return json
      .map((it): Product | null => {
        const item = it as CatalogItem;
        const id = typeof item.id === "string" ? item.id : "";
        const slug = typeof item.slug === "string" ? item.slug : "";
        const name =
          (typeof item.name === "string" ? item.name : "") ||
          (typeof item.title === "string" ? item.title : "");
        if (!id || !slug || !name) return null;

        const images = Array.isArray(item.images)
          ? (item.images.filter((x) => typeof x === "string") as string[])
          : [];

        const marketplaces =
          typeof item.marketplaces === "object" &&
          item.marketplaces !== null &&
          !Array.isArray(item.marketplaces)
            ? (item.marketplaces as Product["marketplaces"])
            : undefined;

        const categories = Array.isArray(item.categories)
          ? (item.categories.filter((x) => typeof x === "string") as string[])
          : undefined;

        return normalizeProduct({
          id,
          slug,
          name,
          brand: typeof item.brand === "string" ? item.brand : undefined,
          price: typeof item.price === "number" ? item.price : 0,
          description: typeof item.description === "string" ? item.description : undefined,
          shortDescription: undefined,
          categories,
          attributes: undefined,
          images,
          thumbnailUrl: images[0] ?? undefined,
          currency: "INR",
          inventoryPolicy: { trackStock: false, allowBackorder: true },
          inventory: undefined,
          marketplaces,
          variants: [],
          isFeatured: false,
          createdAt: now,
          updatedAt: now,
        });
      })
      .filter((p): p is Product => Boolean(p));
  } catch (error) {
    console.error("readCatalogProducts failed:", error);
    return [];
  }
}

async function readCatalogSlugs(): Promise<string[]> {
  const products = await readCatalogProducts();
  return products.map((p) => p.slug).filter(Boolean);
}

/* ----------------------------------
   Slug-to-ID Cache (5 minute cache)
   This reduces repeated slug queries by caching the mapping
----------------------------------- */
const getProductIdBySlugCached = unstable_cache(
  async (slug: string): Promise<string | null> => {
    try {
      const snap = await dbAdmin
        .collection("products")
        .where("slug", "==", slug)
        .select() // Only fetch document reference, not data
        .limit(1)
        .get();

      if (snap.empty) return null;
      return snap.docs[0].id;
    } catch (error) {
      console.error("getProductIdBySlug failed:", error);
      return null;
    }
  },
  ["product-slug-to-id"],
  { revalidate: 300, tags: ["products"] } // 5 minute cache
);

/* ----------------------------------
   Get product by ID (direct lookup - 1 read)
   Wrapped with cache() for request deduplication
----------------------------------- */
const getProductByIdRaw = async (id: string): Promise<Product | null> => {
  try {
    const doc = await dbAdmin.collection("products").doc(id).get();
    if (!doc.exists) return null;

    const product = serializeFirestore({
      id: doc.id,
      ...(doc.data() as Omit<Product, "id">),
    }) as Product;

    return normalizeProduct(product);
  } catch (error) {
    console.error("getProductById failed:", error);
    return null;
  }
};

// React cache() deduplicates within same request
export const getProductById = cache(getProductByIdRaw);

/* ----------------------------------
   Get ALL products (cached with unstable_cache)
----------------------------------- */
const getAllProductsRaw = async (): Promise<Product[]> => {
  try {
    const snap = await dbAdmin.collection("products").get();

    return snap.docs.map((d) => {
      const product = serializeFirestore({
        id: d.id,
        ...(d.data() as Omit<Product, "id">),
      }) as Product;
      return normalizeProduct(product);
    });
  } catch (error) {
    console.error("getAllProducts failed:", error);
    return readCatalogProducts();
  }
};

// Use unstable_cache for cross-request caching (60 seconds)
export const getAllProducts = unstable_cache(
  getAllProductsRaw,
  ["all-products"],
  { revalidate: 60, tags: ["products"] }
);

/* ----------------------------------
   Get product by slug (optimized)
   1. Check slug-to-ID cache (cached, no read if hit)
   2. Fetch by ID (1 read, deduplicated within request)
----------------------------------- */
const getProductBySlugRaw = async (slug: string): Promise<Product | null> => {
  try {
    // Products are keyed by their slug, so the slug IS the document id —
    // a direct doc(slug) get (1 read, no index, request-deduped by getProductById).
    const direct = await getProductById(slug);
    if (direct) return direct;

    // Fallback for legacy products not yet re-keyed to their slug. Safe to
    // delete (along with getProductIdBySlugCached) once
    // scripts/migrate-product-slugs.ts has run everywhere.
    const productId = await getProductIdBySlugCached(slug);
    if (productId) return await getProductById(productId);

    return null;
  } catch (error) {
    console.error("getProductBySlug failed:", error);
    const products = await readCatalogProducts();
    return products.find((p) => p.slug === slug) ?? null;
  }
};

// React cache() for request deduplication - multiple calls in same request = 1 fetch
export const getProductBySlug = cache(getProductBySlugRaw);

/* ----------------------------------
   Get products by IDs (cached)
----------------------------------- */
export const getProductsByIds = cache(async (ids: string[]): Promise<Product[]> => {
  try {
    if (!ids.length) return [];

    const snaps = await Promise.all(
      ids.map((id) => dbAdmin.collection("products").doc(id).get())
    );

    return snaps
      .filter((d) => d.exists)
      .map((d) => {
        const product = serializeFirestore({
          id: d.id,
          ...(d.data() as Omit<Product, "id">),
        }) as Product;
        return normalizeProduct(product);
      });
  } catch (error) {
    console.error("getProductsByIds failed:", error);
    const products = await readCatalogProducts();
    const idSet = new Set(ids);
    return products.filter((p) => idSet.has(p.id));
  }
});

/* ----------------------------------
   Get featured products (cached cross-request)
----------------------------------- */
const getFeaturedProductsRaw = async (limit = 6): Promise<Product[]> => {
  try {
    const snap = await dbAdmin
      .collection("products")
      .where("isFeatured", "==", true)
      .limit(limit)
      .get();

    return snap.docs.map((d) => {
      const product = serializeFirestore({
        id: d.id,
        ...(d.data() as Omit<Product, "id">),
      }) as Product;
      return normalizeProduct(product);
    });
  } catch (error) {
    console.error("getFeaturedProducts failed:", error);
    const products = await readCatalogProducts();
    return products.slice(0, Math.max(0, limit));
  }
};

export const getFeaturedProducts = unstable_cache(
  getFeaturedProductsRaw,
  ["featured-products"],
  { revalidate: 60, tags: ["products"] }
);

/* ----------------------------------
   Get all slugs (cached cross-request)
----------------------------------- */
const getAllSlugsRaw = async (): Promise<string[]> => {
  try {
    const snap = await dbAdmin
      .collection("products")
      .select("slug")
      .get();

    return snap.docs
      .map((d) => {
        const data = d.data() as { slug?: unknown };
        return typeof data.slug === "string" ? data.slug : null;
      })
      .filter((s): s is string => Boolean(s));
  } catch (error) {
    console.error("getAllSlugs failed:", error);
    return readCatalogSlugs();
  }
};

export const getAllSlugs = unstable_cache(
  getAllSlugsRaw,
  ["all-slugs"],
  { revalidate: 300, tags: ["products"] }
);

/* ----------------------------------
   Get random products (for related products - avoids fetching all)
----------------------------------- */
const getRandomProductsRaw = async (excludeSlug: string, limit = 4): Promise<Product[]> => {
  try {
    // Fetch a small batch more than needed for randomization
    const snap = await dbAdmin
      .collection("products")
      .limit(20)
      .get();

    const products = snap.docs
      .map((d) => {
        const product = serializeFirestore({
          id: d.id,
          ...(d.data() as Omit<Product, "id">),
        }) as Product;
        return normalizeProduct(product);
      })
      .filter((p) => p.slug !== excludeSlug);

    // Shuffle and take limit
    const shuffled = products.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  } catch (error) {
    console.error("getRandomProducts failed:", error);
    return [];
  }
};

export const getRandomProducts = cache(getRandomProductsRaw);

/* ----------------------------------
   Get products by collection (paginated)
   Uses collectionId for direct query (indexed)
----------------------------------- */
export async function getProductsByCollectionId(
  collectionId: string,
  cursor?: string
): Promise<{ products: Product[]; nextCursor: string | null }> {
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
      ...(doc.data() as Omit<Product, "id">),
    }));

    const nextCursor =
      snap.docs.length === PAGE_SIZE
        ? snap.docs[snap.docs.length - 1].id
        : null;

    return {
      products: (serializeFirestore(products) as Product[]).map(normalizeProduct),
      nextCursor,
    };
  } catch (error) {
    console.error("❌ getProductsByCollectionId failed:", error);
    return { products: [], nextCursor: null };
  }
}
