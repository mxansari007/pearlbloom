"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import type { MouseEvent } from "react";
import type { Product } from "../types/products";
import { useWishlistStore } from "@/store/useWishlistStore";
import { getProductPriceInfo, getStartingVariantPriceInfo, isProductOutOfStock } from "@/libs/pricing";
import { productPath } from "@/libs/productUrl";
import { track } from "@/utils/analytics";
import StatusBadge from "./product/StatusBadge";
import CardRating from "./product/CardRating";
import QuickAdd from "./product/QuickAdd";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const image = product.thumbnailUrl || product.images?.[0] || "/images/placeholder.svg";

  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.items.some((i) => i.id === product.id));

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const priceInfo =
    variants.length > 0
      ? getStartingVariantPriceInfo(product) ?? { original: 0, final: 0, hasDiscount: false, discountPercent: 0 }
      : getProductPriceInfo(product);

  const { original, final, hasDiscount, discountPercent } = priceInfo;
  const outOfStock = isProductOutOfStock(product);

  function handleWishlist(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    track(isWishlisted ? "wishlist_item_removed" : "wishlist_item_added", {
      product_id: product.id,
      slug: product.slug,
      price: final,
      source: "product_card",
    });
    toggleWishlist({ id: product.id, name: product.name, price: final, image, slug: product.slug });
  }

  return (
    <article className="product-card group relative">
      {/* IMAGE INSET */}
      <div className="product-card__media">
        <StatusBadge product={product} />

        {outOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" style={{ background: "rgba(0,0,0,0.45)" }}>
            <span className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white" style={{ background: "rgba(0,0,0,0.82)", border: "1px solid rgba(255,255,255,0.25)" }}>
              Sold Out
            </span>
          </div>
        )}

        <Image
          src={image}
          alt={product.imageAlt?.[image] || product.name}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="product-card__img"
        />
      </div>

      {/* WISHLIST BUTTON — floating circle overlapping image top-right */}
      <button
        type="button"
        onClick={handleWishlist}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className="product-card__wishlist"
      >
        <Heart
          size={16}
          strokeWidth={2}
          className={`transition-all duration-300 ${
            isWishlisted ? "fill-red-500 stroke-red-500" : "stroke-current"
          }`}
        />
      </button>

      {/* BODY */}
      <div className="product-card__body">
        {(product.ratingCount ?? 0) > 0 && (
          <CardRating avg={product.ratingAvg} count={product.ratingCount} className="mb-1" />
        )}

        <h3 className="product-card__title">
          <Link
            href={productPath(product)}
            className="after:absolute after:inset-0 after:z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--gold-rgb))] rounded"
            onClick={() =>
              track("product_clicked", {
                product_id: product.id,
                slug: product.slug,
                price: final,
                has_discount: hasDiscount,
                discount_percent: discountPercent,
              })
            }
          >
            {product.name}
          </Link>
        </h3>

        <div className="product-card__footer">
          <div className="product-card__price-area">
            <span className="product-card__price">{inr(final)}</span>
            {hasDiscount && (
              <div className="product-card__discount-row">
                <span className="product-card__price-original">{inr(original)}</span>
                <span className="product-card__discount-badge">{discountPercent}% OFF</span>
              </div>
            )}
          </div>
          {!outOfStock && (
            <QuickAdd product={product} iconOnly />
          )}
        </div>
      </div>
    </article>
  );
}
