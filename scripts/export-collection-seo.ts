/* One-off: export the code-default SEO for every facet collection so the admin
   "Page SEO" editor can pre-fill real values. Run: npx tsx scripts/export-collection-seo.ts */
import { writeFileSync } from "node:fs";
import { ALL_CATEGORIES } from "../libs/earringCategories";
import { getCollectionSeo, getAllEarringsSeo } from "../content/seo/earrings";

const groupLabel: Record<string, string> = { style: "Style", finish: "Finish", occasion: "Occasion" };

type Row = {
  key: string;
  type: string;
  slug: string;
  name: string;
  group: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lede: string;
  keywords: string[];
  faqs: { q: string; a: string }[];
};

const out: Row[] = [];

const hub = getAllEarringsSeo();
out.push({
  key: "all-earrings", type: "all", slug: "all-earrings", name: "All Earrings", group: "Hub",
  metaTitle: hub.metaTitle, metaDescription: hub.metaDescription, h1: hub.h1, lede: hub.lede,
  keywords: hub.secondaryKeywords, faqs: hub.faqs,
});

for (const c of ALL_CATEGORIES) {
  const s = getCollectionSeo(c.type, c.slug);
  if (!s) continue;
  out.push({
    key: `${c.type}-${c.slug}`, type: c.type, slug: c.slug, name: c.name, group: groupLabel[c.type] ?? c.type,
    metaTitle: s.metaTitle, metaDescription: s.metaDescription, h1: s.h1, lede: s.lede,
    keywords: s.secondaryKeywords, faqs: s.faqs,
  });
}

writeFileSync("collection-seo-defaults.json", JSON.stringify(out, null, 2));
console.log(`Exported ${out.length} collection SEO defaults -> collection-seo-defaults.json`);
