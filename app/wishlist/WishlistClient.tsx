"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlistStore } from "@/store/useWishlistStore";
import { Trash2, ArrowRight } from "lucide-react";
import type { Product } from "@/types/products";
import { getProductPriceInfo, getStartingVariantPriceInfo } from "@/libs/pricing";

export default function WishlistClient({ allProducts }: { allProducts: Product[] }) {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const update = useWishlistStore((s) => s.update);
  const hydrated = useWishlistStore((s) => s.hasHydrated);
  const productsById = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts]);

  useEffect(() => {
    if (!hydrated) return;

    if (items.length === 0 || productsById.size === 0) return;

    items.forEach((item) => {
      const product = productsById.get(item.id);
      if (!product) return;

      const variants = Array.isArray(product.variants) ? product.variants : [];
      const priceInfo =
        variants.length > 0
          ? getStartingVariantPriceInfo(product) ?? { original: 0, final: 0, hasDiscount: false, discountPercent: 0 }
          : getProductPriceInfo(product);

      const updates: Partial<typeof item> = {};
      if (!item.slug && product.slug) updates.slug = product.slug;
      if (typeof priceInfo.final === "number" && priceInfo.final > 0 && item.price !== priceInfo.final) updates.price = priceInfo.final;
      if (!item.image) {
        const img = product.thumbnailUrl ?? product.images?.[0];
        if (img) updates.image = img;
      }

      if (Object.keys(updates).length > 0) update(item.id, updates);
    });
  }, [hydrated, items, productsById, update]);

  if (!hydrated) {
    return (
      <div
        className="min-h-screen relative overflow-hidden"
        style={{ background: "var(--bg)", color: "var(--fg)" }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          <div className="h-10 w-48 bg-[var(--card-bg-soft)] rounded animate-pulse mb-12"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1,2,3,4].map(i => (
                <div key={i} className="aspect-[4/5] bg-[var(--card-bg-soft)] rounded-xl animate-pulse"></div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[rgba(212,175,55,0.08)] rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[rgba(212,175,55,0.05)] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-medium">Your Wishlist</h1>
            <p className="text-muted mt-2">Saved items for later</p>
          </div>
          <Link
            href="/products"
            className="text-sm transition flex items-center gap-2 hover:opacity-80"
            style={{ color: "rgb(212,175,55)" }}
          >
            Continue Shopping <ArrowRight size={16} />
          </Link>
        </div>

        {/* Content */}
        {items.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 text-center">
             <div className="w-20 h-20 rounded-full bg-[var(--input-bg)] flex items-center justify-center mb-6 border border-[var(--input-border)]">
               <span className="text-3xl">♡</span>
             </div>
            <h2 className="text-2xl font-display font-medium mb-3">Your wishlist is empty</h2>
            <p className="mb-8 max-w-md text-muted">
              Start adding your favorite pieces to create your personal collection of exquisite jewelry.
            </p>
            <Link
              href="/products"
              className="btn-cta inline-flex items-center gap-2"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => {
              const product = productsById.get(item.id);
              const variants = product && Array.isArray(product.variants) ? product.variants : [];
              const priceInfo = product
                ? variants.length > 0
                  ? getStartingVariantPriceInfo(product) ?? { original: item.price, final: item.price, hasDiscount: false, discountPercent: 0 }
                  : getProductPriceInfo(product)
                : { original: item.price, final: item.price, hasDiscount: false, discountPercent: 0 };

              const formattedFinal = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(priceInfo.final);

              const formattedOriginal = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(priceInfo.original);

              return (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-xl overflow-hidden card transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <Link href={item.slug ? `/product/${item.slug}` : '#'} className="relative aspect-[4/5] overflow-hidden bg-[var(--panel)] block">
                   <Image
                      src={item.image || "/images/placeholder.svg"}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        remove(item.id);
                      }}
                      className="absolute top-3 right-3 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-red-400 hover:bg-black/60 hover:border-red-400/30 transition-all z-20"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                </Link>

                {/* Details */}
                <div className="p-5 flex flex-col flex-1">
                  <Link href={item.slug ? `/product/${item.slug}` : '#'} className="block">
                    <h3 className="font-display text-lg mb-1 truncate group-hover:text-[rgb(212,175,55)] transition-colors">{item.name}</h3>
                  </Link>
                  <div className="mb-5">
                    <div className="flex items-baseline gap-2">
                      <div className="text-sm font-medium" style={{ color: "rgb(var(--gold-rgb))" }}>
                        {formattedFinal}
                      </div>
                      {priceInfo.hasDiscount ? (
                        <div className="text-xs line-through text-muted">
                          {formattedOriginal}
                        </div>
                      ) : null}
                      {priceInfo.hasDiscount ? (
                        <div
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(var(--gold-rgb),0.12)",
                            border: "1px solid rgba(var(--gold-rgb),0.22)",
                            color: "rgb(var(--gold-rgb))",
                          }}
                        >
                          {priceInfo.discountPercent}% OFF
                        </div>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <Link 
                      href={item.slug ? `/product/${item.slug}` : '#'}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[var(--input-border)] hover:border-[rgb(212,175,55)] hover:bg-[rgba(212,175,55,0.05)] hover:text-[rgb(212,175,55)] transition-all text-sm font-medium bg-[var(--input-bg)]"
                    >
                      <ArrowRight size={16} />
                      View Product
                    </Link>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
