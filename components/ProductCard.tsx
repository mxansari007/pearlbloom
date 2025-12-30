"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ArrowRight } from "lucide-react";
import type { MouseEvent } from "react";
import type { Product } from "../types/products";
import { useWishlistStore } from "@/store/useWishlistStore";
import { getFinalPrice } from "@/libs/pricing";
import { track } from "@/utils/analytics";

export default function ProductCard({ product }: { product: Product }) {
  const image =
    product.thumbnailUrl ||
    product.images?.[0] ||
    "/images/placeholder.svg";

  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) =>
    s.items.some((i) => i.id === product.id)
  );

  /* PRICING */
  const variants = Array.isArray(product.variants) ? product.variants : [];
  type VariantLegacyDiscount = Product["variants"][number] & {
    discountPrice?: number;
    discountPercent?: number;
  };
  type ProductLegacyDiscount = Product & {
    discountPrice?: number;
    discountPercent?: number;
  };
  let startingOriginalPrice = 0;
  let startingFinalPrice = 0;
  let hasDiscount = false;
  let discountPercent = 0;

  if (variants.length > 0) {
    const pricePairs = variants
      .map((v) => {
        const dv = v as VariantLegacyDiscount;
        const original = typeof v.price === "number" ? v.price : 0;
        const maybeDiscountPrice = dv.discountPrice;
        const maybeDiscountPercent = dv.discountPercent;
        const final =
          v.discount
            ? getFinalPrice(v)
            : typeof maybeDiscountPrice === "number"
            ? maybeDiscountPrice
            : typeof maybeDiscountPercent === "number"
            ? Math.round(original * (1 - maybeDiscountPercent / 100))
            : original;
        return { original, final };
      })
      .filter((p) => p.original > 0);

    if (pricePairs.length > 0) {
      const minFinal = Math.min(...pricePairs.map((p) => p.final));
      const match = pricePairs.find((p) => p.final === minFinal) ?? pricePairs[0];
      startingOriginalPrice = match.original;
      startingFinalPrice = match.final;
      hasDiscount = startingFinalPrice < startingOriginalPrice;
      discountPercent = hasDiscount
        ? Math.round((1 - startingFinalPrice / startingOriginalPrice) * 100)
        : 0;
    } else {
      startingOriginalPrice = 0;
      startingFinalPrice = 0;
      hasDiscount = false;
      discountPercent = 0;
    }
  } else {
    const dp = product as ProductLegacyDiscount;
    startingOriginalPrice = typeof product.price === "number" ? product.price : 0;
    const maybeDiscountPrice = dp.discountPrice;
    const maybeDiscountPercent =
      dp.discountPercent ?? product.inventory?.discountPercent ?? 0;

    if (typeof maybeDiscountPrice === "number" && startingOriginalPrice > 0) {
      startingFinalPrice = maybeDiscountPrice;
      hasDiscount = startingFinalPrice < startingOriginalPrice;
      discountPercent = hasDiscount
        ? Math.round((1 - startingFinalPrice / startingOriginalPrice) * 100)
        : 0;
    } else if (
      typeof maybeDiscountPercent === "number" &&
      maybeDiscountPercent > 0 &&
      startingOriginalPrice > 0
    ) {
      discountPercent = maybeDiscountPercent;
      hasDiscount = true;
      startingFinalPrice = Math.round(
        startingOriginalPrice * (1 - maybeDiscountPercent / 100)
      );
    } else {
      startingFinalPrice = startingOriginalPrice;
      hasDiscount = false;
      discountPercent = 0;
    }
  }

  const savingsAmount = hasDiscount
    ? Math.max(0, startingOriginalPrice - startingFinalPrice)
    : 0;

  function handleWishlist(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    track(isWishlisted ? "wishlist_item_removed" : "wishlist_item_added", {
      product_id: product.id,
      slug: product.slug,
      price: startingFinalPrice,
      source: "product_card",
    });

    toggleWishlist({
      id: product.id,
      name: product.name,
      price: startingFinalPrice,
      image,
      slug: product.slug,
    });
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="block group"
      onClick={() => {
        track("product_clicked", {
          product_id: product.id,
          slug: product.slug,
          price: startingFinalPrice,
          has_discount: hasDiscount,
          discount_percent: discountPercent,
        });
      }}
    >
      <article className="product-card">
        {/* IMAGE CONTAINER */}
        <div className="product-card__media">
          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-3 right-3 z-20
                       w-10 h-10 rounded-full
                       flex items-center justify-center
                       transition-all duration-300
                       hover:scale-110
                       active:scale-95"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.8)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(212, 175, 55, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Heart
              size={18}
              strokeWidth={2}
              className={`transition-all duration-300 ${
                isWishlisted
                  ? "fill-red-500 stroke-red-500"
                  : "stroke-white/90"
              }`}
            />
          </button>

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="product-card__discount-badge">
              <span className="product-card__discount-badge-text">
                {discountPercent}% OFF
              </span>
            </div>
          )}

          {/* Product Image */}
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="product-card__img"
          />

          {/* Quick Add Overlay */}
          <div className="absolute inset-x-0 bottom-0 z-10
                        p-3
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-300"
               style={{
                 background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4), transparent)',
               }}>
            <button 
              className="w-full
                         flex items-center justify-center gap-2
                         py-3 px-4
                         rounded-xl
                         text-black text-sm font-bold uppercase tracking-wider
                         transition-all duration-300
                         active:scale-95
                         hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              style={{
                background: 'rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.borderColor = 'rgb(212, 175, 55)';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                e.currentTarget.style.color = '#000';
              }}
            >
              <ArrowRight size={18} />
              <span>View Product</span>
            </button>
          </div>
        </div>

        {/* CARD BODY */}
        <div className="product-card__body">
          {/* Product Name */}
          <h3 className="product-card__title line-clamp-2">
            {product.name}
          </h3>

          {/* Short description */}
          {product.shortDescription && (
            <p
              className="mt-1 mb-3 text-xs line-clamp-2"
              style={{ color: 'var(--muted)' }}
            >
              {product.shortDescription}
            </p>
          )}

          {/* PRICING */}
          <div className="mt-auto pt-2">
            <div className="product-card__price-row">
              {/* Discounted Price */}
              <span className="product-card__price text-xl">
                ₹{startingFinalPrice.toLocaleString("en-IN")}
              </span>

              {/* Original Price */}
              {hasDiscount && (
                <>
                  <span className="product-card__price-original">
                    ₹{startingOriginalPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="product-card__save-chip">
                    Save ₹{savingsAmount.toLocaleString("en-IN")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
