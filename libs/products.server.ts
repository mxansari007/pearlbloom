import { cache } from "react";
import { unstable_cache } from "next/cache";
import { dbAdmin } from "./firebase-admin";
import { serializeFirestore } from "./serialize";
import type { Product } from "@/types/products";
import type { Review } from "@/types/reviews";
import { readFile } from "node:fs/promises";
import path from "node:path";

/* ----------------------------------
   Fail-fast wrapper for Firestore reads.

   When the Firestore backend is slow or unreachable, the Admin SDK can hang for
   30–60s before its own internal timeout fires. During SSR that keeps the
   streaming response open so long it gets aborted before React's hydration
   payload finishes — leaving the page visible but non-interactive. We bound
   every read to a few seconds and let the caller's existing catch fall back to
   the bundled catalog / safe defaults. When Firestore is healthy (production),
   reads return in milliseconds, so this never triggers.
----------------------------------- */
const FIRESTORE_TIMEOUT_MS = 2500;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${FIRESTORE_TIMEOUT_MS}ms`));
    }, FIRESTORE_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

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
      const snap = await withTimeout(
        dbAdmin
          .collection("products")
          .where("slug", "==", slug)
          .select() // Only fetch document reference, not data
          .limit(1)
          .get(),
        "getProductIdBySlug"
      );

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
    const doc = await withTimeout(
      dbAdmin.collection("products").doc(id).get(),
      "getProductById"
    );
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
  // 1. Primary path: products are keyed by their slug, so the slug IS the
  //    document id — a direct doc(slug) get (1 read, request-deduped).
  try {
    const direct = await getProductById(slug);
    if (direct) return direct;
  } catch (error) {
    console.error("getProductBySlug direct lookup failed:", error);
  }

  // 2. Local catalog fallback (bundled JSON, no network). Runs whenever the
  //    Firestore lookup misses OR is slow/unreachable, so the page still
  //    renders instead of 404-ing or hanging the SSR stream. (The inner
  //    helpers swallow their own errors and return null, so this must live
  //    outside a try/catch around them — not only on a thrown error.)
  try {
    const products = await readCatalogProducts();
    const fromCatalog = products.find((p) => p.slug === slug);
    if (fromCatalog) return fromCatalog;
  } catch (error) {
    console.error("getProductBySlug catalog fallback failed:", error);
  }

  // 3. Legacy path for products not yet re-keyed to their slug. Safe to delete
  //    (with getProductIdBySlugCached) once migrate-product-slugs.ts has run
  //    everywhere.
  try {
    const productId = await getProductIdBySlugCached(slug);
    if (productId) return await getProductById(productId);
  } catch (error) {
    console.error("getProductBySlug legacy lookup failed:", error);
  }

  return null;
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
   Get products flagged "New Arrivals" in the admin (isNewArrival == true).
   Returns [] when none are flagged so the homepage can fall back to the
   newest-by-date list.
----------------------------------- */
const getNewArrivalProductsRaw = async (limit = 8): Promise<Product[]> => {
  try {
    const snap = await dbAdmin
      .collection("products")
      .where("isNewArrival", "==", true)
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
    console.error("getNewArrivalProducts failed:", error);
    return [];
  }
};

export const getNewArrivalProducts = unstable_cache(
  getNewArrivalProductsRaw,
  ["new-arrival-products"],
  { revalidate: 60, tags: ["products"] }
);

/* ----------------------------------
   Get all slugs (cached cross-request)
----------------------------------- */
const getAllSlugsRaw = async (): Promise<string[]> => {
  try {
    const snap = await withTimeout(
      dbAdmin.collection("products").select("slug").get(),
      "getAllSlugs"
    );

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
    const snap = await withTimeout(
      dbAdmin.collection("products").limit(20).get(),
      "getRandomProducts"
    );

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

/* ----------------------------------
   Review summary (server) — for Product JSON-LD AggregateRating.
   Gated on real data: returns count 0 when there are no reviews.
----------------------------------- */
export const getProductReviewSummary = cache(
  async (productId: string): Promise<{ count: number; average: number }> => {
    try {
      const snap = await withTimeout(
        dbAdmin
          .collection("reviews")
          .where("productId", "==", productId)
          .get(),
        "getProductReviewSummary"
      );
      if (snap.empty) return { count: 0, average: 0 };

      let sum = 0;
      let n = 0;
      snap.docs.forEach((d) => {
        const raw = (d.data() as { rating?: unknown }).rating;
        const rating = typeof raw === "number" ? raw : Number(raw);
        if (Number.isFinite(rating) && rating > 0 && rating <= 5) {
          sum += rating;
          n += 1;
        }
      });
      if (!n) return { count: 0, average: 0 };
      return { count: n, average: Math.round((sum / n) * 10) / 10 };
    } catch (error) {
      console.error("getProductReviewSummary failed:", error);
      return { count: 0, average: 0 };
    }
  }
);

/* ----------------------------------
   Ratings map (server) — one read of the reviews collection, grouped by
   productId. Used to enrich catalog grids with real, gated ratings.
----------------------------------- */
export const getRatingsMap = cache(
  async (): Promise<Map<string, { average: number; count: number }>> => {
    const acc = new Map<string, { sum: number; count: number }>();
    try {
      const snap = await dbAdmin.collection("reviews").get();
      snap.docs.forEach((d) => {
        const data = d.data() as { productId?: unknown; rating?: unknown };
        const pid = typeof data.productId === "string" ? data.productId : null;
        const rating = typeof data.rating === "number" ? data.rating : Number(data.rating);
        if (!pid || !Number.isFinite(rating) || rating <= 0 || rating > 5) return;
        const e = acc.get(pid) ?? { sum: 0, count: 0 };
        e.sum += rating;
        e.count += 1;
        acc.set(pid, e);
      });
    } catch (error) {
      console.error("getRatingsMap failed:", error);
    }
    const out = new Map<string, { average: number; count: number }>();
    acc.forEach((v, k) => out.set(k, { average: Math.round((v.sum / v.count) * 10) / 10, count: v.count }));
    return out;
  }
);

/** Enrich a product list with real review ratings (gated; no-op when none). */
export async function attachRatings(products: Product[]): Promise<Product[]> {
  const map = await getRatingsMap();
  if (!map.size) return products;
  return products.map((p) => {
    const r = map.get(p.id);
    return r ? { ...p, ratingAvg: r.average, ratingCount: r.count } : p;
  });
}

/* ----------------------------------
   Global reviews (server) — for the homepage social-proof section.
   Gated on real data: count is 0 when there are no reviews.
----------------------------------- */
export const getGlobalReviewSummary = cache(
  async (): Promise<{ count: number; average: number }> => {
    try {
      const snap = await dbAdmin.collection("reviews").get();
      let sum = 0;
      let n = 0;
      snap.docs.forEach((d) => {
        const raw = (d.data() as { rating?: unknown }).rating;
        const rating = typeof raw === "number" ? raw : Number(raw);
        if (Number.isFinite(rating) && rating > 0 && rating <= 5) {
          sum += rating;
          n += 1;
        }
      });
      return n ? { count: n, average: Math.round((sum / n) * 10) / 10 } : { count: 0, average: 0 };
    } catch (error) {
      console.error("getGlobalReviewSummary failed:", error);
      return { count: 0, average: 0 };
    }
  }
);

/** Most recent real reviews (with text), newest first — for the homepage. */
export const getRecentReviews = cache(async (max = 6): Promise<Review[]> => {
  try {
    const snap = await dbAdmin
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .limit(max * 2)
      .get();
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }));
    return list.filter((r) => typeof r.text === "string" && r.text.trim().length > 0).slice(0, max);
  } catch (error) {
    console.error("getRecentReviews failed:", error);
    return [];
  }
});

/* ----------------------------------
   Related products by shared facet tags (style / finish / occasion).
   Ranks by number of shared tags; falls back to none if untagged.
----------------------------------- */
export const getRelatedByFacets = cache(
  async (slug: string, limit = 8): Promise<Product[]> => {
    try {
      const all = await getAllProducts();
      const current = all.find((p) => p.slug === slug);
      if (!current) return [];

      const facetsOf = (p: Product) => [
        ...(p.style ?? []),
        ...(p.finish ?? []),
        ...(p.occasion ?? []),
      ];
      const mine = new Set(facetsOf(current));
      if (mine.size === 0) return [];

      return all
        .filter((p) => p.slug !== slug)
        .map((p) => ({ p, shared: facetsOf(p).filter((f) => mine.has(f)).length }))
        .filter((x) => x.shared > 0)
        .sort((a, b) => b.shared - a.shared)
        .slice(0, limit)
        .map((x) => x.p);
    } catch (error) {
      console.error("getRelatedByFacets failed:", error);
      return [];
    }
  }
);
