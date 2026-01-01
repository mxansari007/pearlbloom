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
   Get ALL products (cached)
----------------------------------- */
export const getAllProducts = async (): Promise<Product[]> => {
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
}

/* ----------------------------------
   Get product by slug (cached)
----------------------------------- */
export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const snap = await dbAdmin
      .collection("products")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snap.empty) return null;

    const product = serializeFirestore({
      id: snap.docs[0].id,
      ...(snap.docs[0].data() as Omit<Product, "id">),
    }) as Product;
    return normalizeProduct(product);
  } catch (error) {
    console.error("getProductBySlug failed:", error);
    const products = await readCatalogProducts();
    return products.find((p) => p.slug === slug) ?? null;
  }
}

/* ----------------------------------
   Get products by IDs (cached)
----------------------------------- */
export const getProductsByIds = async (ids: string[]): Promise<Product[]> => {
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
}

/* ----------------------------------
   Get featured products (cached)
----------------------------------- */
export const getFeaturedProducts = async (limit = 6): Promise<Product[]> => {
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
}

/* ----------------------------------
   Get all slugs (cached)
----------------------------------- */
export const getAllSlugs = async (): Promise<string[]> => {
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
}



/* ----------------------------------
   Get products by collection (paginated)
----------------------------------- */
export async function getProductsByCollectionId(
  collectionId: string,
  cursor?: string
): Promise<{ products: Product[]; nextCursor: string | null }> {
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
