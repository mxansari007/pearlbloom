import Link from "next/link";
import type { Product } from "../../types/products";
import {
  getCategory,
  STYLE_CATEGORIES,
  FINISH_CATEGORIES,
  OCCASION_CATEGORIES,
  type CatType,
  type EarringCategory,
} from "../../libs/earringCategories";

const GROUPS: { type: CatType; items: EarringCategory[] }[] = [
  { type: "style", items: STYLE_CATEGORIES },
  { type: "finish", items: FINISH_CATEGORIES },
  { type: "occasion", items: OCCASION_CATEGORIES },
];

/**
 * Resolve one facet per type for a product. Prefers explicit admin tags;
 * falls back to matching the product name/categories against the taxonomy —
 * the SAME basis EarringFilterBrowser uses to classify products for filtering,
 * so chips stay truthful even before admin tagging is complete.
 */
function resolveChip(product: Product, type: CatType, items: EarringCategory[]) {
  const explicit = (product[type] as string[] | undefined)?.[0];
  if (explicit) {
    const cat = getCategory(type, explicit);
    return { type, slug: explicit, name: cat?.name ?? explicit.replace(/-/g, " ") };
  }
  const hay = [product.name, ...(product.categories ?? [])].join(" ").toLowerCase();
  const match = items.find(
    (c) => hay.includes(c.name.toLowerCase()) || hay.includes(c.slug.replace(/-/g, " "))
  );
  return match ? { type, slug: match.slug, name: match.name } : null;
}

/**
 * Crawlable Style/Finish/Occasion chips (one per facet) linking to the facet
 * collection — powers UX + internal linking. Renders nothing when nothing matches.
 */
export default function TaxonomyChips({ product, className = "" }: { product: Product; className?: string }) {
  const chips = GROUPS.map((g) => resolveChip(product, g.type, g.items)).filter(
    (c): c is { type: CatType; slug: string; name: string } => Boolean(c)
  );

  if (!chips.length) return null;

  return (
    <div className={`relative z-10 flex flex-wrap gap-1.5 ${className}`}>
      {chips.map((c) => (
        <Link
          key={`${c.type}-${c.slug}`}
          href={`/earrings/${c.type}/${c.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="taxonomy-chip inline-block rounded-full px-2.5 py-0.5 text-[11px] capitalize"
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
