import type { CatType } from "../../../libs/earringCategories";
import type { CollectionSeo, CollectionSeoMap } from "./types";
import { STYLE_SEO } from "./styles";
import { FINISH_SEO } from "./finishes";
import { OCCASION_SEO } from "./occasions";
import { ALL_EARRINGS_SEO } from "./all-earrings";

const MAP: Record<CatType, CollectionSeoMap> = {
  style: STYLE_SEO,
  finish: FINISH_SEO,
  occasion: OCCASION_SEO,
};

/** SEO content for a facet page, or null if none authored yet (page falls back to taxonomy copy). */
export function getCollectionSeo(type: string, slug: string): CollectionSeo | null {
  const group = MAP[type as CatType];
  return group?.[slug] ?? null;
}

/** SEO content for the All Earrings hub. */
export function getAllEarringsSeo(): CollectionSeo {
  return ALL_EARRINGS_SEO;
}

export type { CollectionSeo };
