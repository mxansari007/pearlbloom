"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import type { Product } from "../types/products";
import { useWishlistStore } from "@/store/useWishlistStore";

export default function ProductCard({ product }: { product: Product }) {
  const image =
    product.thumbnailUrl ||
    product.images?.[0] ||
    "/images/placeholder.png";

  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) =>
    s.items.some((i) => i.id === product.id)
  );

  /* PRICING */
  const discountPercent = product.inventory?.discountPercent ?? 0;
  const hasDiscount = discountPercent > 0;

  const originalPrice = product.price;
  const discountedPrice = hasDiscount
    ? Math.round(originalPrice * (1 - discountPercent / 100))
    : originalPrice;

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist({
      id: product.id,
      name: product.name,
      price: discountedPrice,
      image,
    });
  }

  return (
    <Link href={`/product/${product.slug}`} className="block group">
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
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
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
            <div className="absolute top-3 left-3 z-20
                          flex items-center gap-1.5
                          px-2.5 py-1.5
                          bg-gradient-to-br from-[rgb(212,175,55)] to-[rgb(180,145,40)]
                          rounded-lg shadow-lg
                          backdrop-blur-sm">
              <Sparkles size={12} className="text-black/80" />
              <span className="text-xs font-bold text-black tracking-wide">
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
                         py-2.5 px-4
                         rounded-lg
                         text-white text-sm font-semibold
                         transition-all duration-200
                         active:scale-95"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <ShoppingBag size={16} />
              <span>Quick View</span>
            </button>
          </div>
        </div>

        {/* CARD BODY */}
        <div className="product-card__body">
          {/* Product Name */}
          <h3 className="product-card__title line-clamp-2">
            {product.name}
          </h3>

          {/* Category or Brand (optional) */}
          {product.category && (
            <p className="text-xs uppercase tracking-wider mt-1 mb-3"
               style={{ color: 'var(--muted)' }}>
              {product.category}
            </p>
          )}

          {/* PRICING */}
          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              {/* Discounted Price */}
              <span className="product-card__price text-xl">
                ₹{discountedPrice.toLocaleString("en-IN")}
              </span>

              {/* Original Price */}
              {hasDiscount && (
                <span className="text-sm line-through"
                      style={{ color: 'var(--muted)' }}>
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Savings Badge */}
            {hasDiscount && (
              <div className="mt-2 inline-flex items-center gap-1
                            px-2 py-1
                            rounded-md"
                   style={{
                     background: 'rgba(34, 197, 94, 0.1)',
                     border: '1px solid rgba(34, 197, 94, 0.2)',
                   }}>
                <span className="text-xs font-semibold"
                      style={{ color: '#22c55e' }}>
                  Save ₹{(originalPrice - discountedPrice).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}