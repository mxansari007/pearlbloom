"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "../types/products";
import { useCartStore } from "../store/useCartStore";
import { ShoppingCart } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";
export default function ProductCard({ product }: { product: Product }) {
  const image =
    product.thumbnailUrl ||
    product.images?.[0] ||
    "/images/placeholder.png";

  const buyLink =
    product.marketplaces.amazon ||
    product.marketplaces.flipkart ||
    product.marketplaces.meesho;

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const theme = useThemeStore((s) => s.theme);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image,
      quantity: 1,
    });

    openCart();
  }

  return (
    <article
      className="rounded-2xl transition"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor =
          "var(--card-border-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor =
          "var(--card-border)")
      }
    >
      <Link href={`/product/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3
            className="text-sm tracking-wide font-display truncate"
            title={product.name}
          >
            {product.name}
          </h3>

          <div className="mt-2 flex items-center justify-between">
            {product.price > 0 ? (
              <div className="text-base font-medium">
                ₹{product.price.toLocaleString("en-IN")}
              </div>
            ) : (
              <div
                className="text-sm mt-1"
                style={{ color: "var(--card-muted)" }}
              >
                Price on request
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div
        className="p-4 flex gap-3"
        style={{
          borderTop: "1px solid var(--card-border)",
          background: "var(--card-bg-soft)",
        }}
      >
        <Link
          href={`/product/${product.slug}`}
          className="px-4 py-2 text-sm rounded-md transition"
          style={{
            border: "1px solid var(--card-border)",
          }}
        >
          View
        </Link>

        {buyLink ? (
          <a
            href={buyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto px-4 py-2 text-sm rounded-md
                       bg-yellow-500 text-black font-medium
                       hover:opacity-90 transition"
          >
            Buy
          </a>
        ) : (
          <button
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className="ml-auto flex items-center justify-center
                       h-10 w-10 rounded-md
                       bg-yellow-500 text-white
                       hover:bg-yellow-400 transition"
          >
          <ShoppingCart size={18} strokeWidth={2} color={theme === "dark" ? "white" : "black"} />
          </button>
        )}
      </div>
    </article>
  );
}
