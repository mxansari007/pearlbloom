import { cache } from "react";
import { dbAdmin } from "./firebase-admin";
import { getCollectionSeo, getAllEarringsSeo } from "../content/seo/earrings";
import type { CollectionSeo } from "../content/seo/earrings/types";
import type { FaqItem } from "../content/shared";

/** Admin-editable subset of CollectionSeo, stored in Firestore collectionSeo/{key}. */
type SeoOverride = Partial<
  Pick<CollectionSeo, "metaTitle" | "metaDescription" | "h1" | "lede" | "secondaryKeywords" | "faqs" | "noindex">
>;

const readOverride = cache(async (key: string): Promise<SeoOverride | null> => {
  try {
    const snap = await dbAdmin.collection("collectionSeo").doc(key).get();
    if (!snap.exists) return null;
    return snap.data() as SeoOverride;
  } catch (error) {
    console.error("readOverride failed:", error);
    return null;
  }
});

function str(s?: string): string | undefined {
  return typeof s === "string" && s.trim() ? s.trim() : undefined;
}

function merge(def: CollectionSeo, o: SeoOverride | null): CollectionSeo {
  if (!o) return def;
  const faqs = Array.isArray(o.faqs) ? o.faqs.filter((f: FaqItem) => f?.q?.trim() && f?.a?.trim()) : [];
  const keywords = Array.isArray(o.secondaryKeywords)
    ? o.secondaryKeywords.filter((k) => typeof k === "string" && k.trim())
    : [];
  return {
    ...def,
    metaTitle: str(o.metaTitle) ?? def.metaTitle,
    metaDescription: str(o.metaDescription) ?? def.metaDescription,
    h1: str(o.h1) ?? def.h1,
    lede: str(o.lede) ?? def.lede,
    secondaryKeywords: keywords.length ? keywords : def.secondaryKeywords,
    faqs: faqs.length ? faqs : def.faqs,
    noindex: typeof o.noindex === "boolean" ? o.noindex : def.noindex,
  };
}

/** Code default for a facet page merged with the admin Firestore override (override wins per field). */
export const getMergedCollectionSeo = cache(
  async (type: string, slug: string): Promise<CollectionSeo | null> => {
    const def = getCollectionSeo(type, slug);
    if (!def) return null;
    return merge(def, await readOverride(`${type}-${slug}`));
  }
);

/** All Earrings hub SEO, merged with its admin override. */
export const getMergedAllEarringsSeo = cache(async (): Promise<CollectionSeo> => {
  return merge(getAllEarringsSeo(), await readOverride("all-earrings"));
});
