// src/components/RelatedProducts.tsx
import { getRandomProducts } from "../libs/products.server";
import ProductCard from "./ProductCard";

/* --------------------------- Export --------------------------- */

/**
 * "You May Also Like" — rendered directly in the product page's server tree
 * (NO Suspense boundary). Related products sit below the fold and
 * getRandomProducts is timeout-bounded, so folding this into the page shell
 * keeps the whole route in a single, reliable render pass. Previously this was
 * an out-of-order streamed Suspense boundary that could get stuck on its
 * skeleton and never hydrate in some environments.
 */
export default async function RelatedProducts({
  currentSlug,
}: {
  currentSlug: string;
}) {
  // Only fetches ~20 products max instead of ALL products.
  const suggestions = await getRandomProducts(currentSlug, 4);

  if (!suggestions.length) return null;

  return (
    <div className="-mx-5 sm:mx-0 bg-[var(--grid-divider)] p-px sm:bg-transparent sm:p-0">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-px sm:gap-6">
        {suggestions.map((p) => (
          <ProductCard product={p} key={p.id} />
        ))}
      </div>
    </div>
  );
}
