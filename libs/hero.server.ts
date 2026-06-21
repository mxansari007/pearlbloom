import { dbAdmin } from "./firebase-admin";


export type HeroData = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  heroImage?: {
    url: string;
    public_id: string;
  };
  /* Optional second image shown when the storefront is in dark mode. Falls
     back to heroImage (then the bundled image) when not set. */
  heroImageDark?: {
    url: string;
    public_id: string;
  };
  /* Caption shown over a custom hero image (the default bundled image has its
     own caption baked in). */
  featuredLabel?: string;
  featuredName?: string;
};

/* ----------------------------------
   Get hero data (cached)
----------------------------------- */
export const getHeroData = async (): Promise<HeroData | null> => {
  try {
    const snap = await dbAdmin
      .collection("siteSettings")
      .doc("main")
      .get();

    if (!snap.exists) return null;

    return snap.data()?.hero ?? null;
  } catch (error) {
    console.error("getHeroData failed:", error);
    return null;
  }
}

/* ----------------------------------
   "Shop by Occasion" image + alt overrides (admin-editable), keyed by slug.
----------------------------------- */
export type OccasionMediaItem = { url?: string; alt?: string };
export type OccasionMedia = Record<string, OccasionMediaItem>;

export const getOccasionMedia = async (): Promise<OccasionMedia> => {
  try {
    const snap = await dbAdmin.collection("siteSettings").doc("main").get();
    if (!snap.exists) return {};
    const occ = snap.data()?.home?.occasions;
    return occ && typeof occ === "object" ? (occ as OccasionMedia) : {};
  } catch (error) {
    console.error("getOccasionMedia failed:", error);
    return {};
  }
};
