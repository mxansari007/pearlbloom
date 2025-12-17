import Link from "next/link";
import type { Product } from "../types/products";

export default function ProductCard({ product }: { product: Product }) {
  const image =
    product.thumbnailUrl ||
    product.images?.[0] ||
    "/images/placeholder.png";

  const buyLink =
    product.marketplaces.amazon ||
    product.marketplaces.flipkart ||
    product.marketplaces.meesho;

  return (
    <article className="rounded-2xl bg-neutral-900/60 border border-white/5 hover:border-yellow-500/30 transition">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="aspect-square overflow-hidden">
          <img
            src={image}
            alt={product.name}
            className="aspect-[3/4] object-cover rounded-xl"
          />
        </div>

        <div className="p-4">
          <h3 className="text-sm tracking-wide font-display">{product.name}</h3>

          <div className="mt-2 flex items-center justify-between">
            {product.price > 0 ? (
              <div className="text-base font-medium">
                ₹{product.price.toLocaleString("en-IN")}
              </div>
            ) : (
              <div className="text-sm mt-1 text-neutral-400">
                Price on request
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4 border-t border-white/10 flex gap-3">
        <Link
          href={`/product/${product.slug}`}
          className="px-4 py-2 text-sm rounded-md border border-white/10 hover:bg-white/5 transition"
        >
          View
        </Link>

        {buyLink ? (
          <a
            href={buyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto px-4 py-2 text-sm rounded-md bg-yellow-500 text-black font-medium hover:opacity-90 transition"
          >
            Buy
          </a>
        ) : (
          <Link
            href="/contact"
            className="ml-auto px-4 py-2 text-sm rounded-md bg-yellow-500 text-black font-medium"
          >
            Enquire
          </Link>
        )}
      </div>
    </article>
  );
}
