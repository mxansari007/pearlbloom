import { dbAdmin } from "./firebase-admin";
import { unstable_noStore as noStore } from "next/cache";


noStore();

export type HeroData = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  heroImage?: {
    url: string;
    public_id: string;
  };
};



export async function getHeroData(): Promise<HeroData | null> {
  const snap = await dbAdmin
    .collection("siteSettings")
    .doc("main")
    .get();

  if (!snap.exists) return null;

  return snap.data()?.hero ?? null;
}
