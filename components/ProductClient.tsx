"use client";

import { useEffect, useState } from "react";
import type { Product, Variant } from "../types/products";
import { isOutOfStock } from "../libs/pricing";
import ProductVariantBlock from "./ProductVariantBlock";
import ProductActions from "./ProductActions";
import { useCartStore } from "@/store/useCartStore";
import { FaAmazon, FaShoppingBag } from "react-icons/fa";
import { SiFlipkart } from "react-icons/si";
import { useProductVariant } from "@/hooks/useProductVariant";

export default function ProductClient({ product }: { product: Product }) {
  const { selectedVariant, setVariant, initializeProduct } = useProductVariant();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    initializeProduct(product);
  }, [initializeProduct, product]);

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const singleVariant = variants.length === 1 ? variants[0] : null;
  const activeVariant = selectedVariant ?? singleVariant;
  const variantSelected = !!activeVariant;

  type MaybeDiscountVariant = Variant & { discountPrice?: number; discountPercent?: number };
  type MaybeDiscountProduct = Product & {
    price?: number;
    discountPrice?: number;
    inventory?: { discountPercent?: number };
  };

  function getVariantPriceInfo(v: Variant | null | undefined) {
    if (!v) return null;
    const mv = v as MaybeDiscountVariant;
    const original = v.price ?? 0;
    const byFlat = typeof mv.discountPrice === "number" ? mv.discountPrice : undefined;
    const byPercent =
      typeof mv.discountPercent === "number"
        ? Math.round(original * (1 - mv.discountPercent / 100))
        : undefined;
    const final = byFlat ?? byPercent ?? original;
    const discountPercent =
      typeof mv.discountPercent === "number"
        ? mv.discountPercent
        : byFlat !== undefined
        ? Math.round((1 - final / original) * 100)
        : undefined;
    return { final, original, discountPercent, hasDiscount: final < original };
  }

  function getProductPriceInfo(p: Product) {
    const mp = p as MaybeDiscountProduct;
    const original = typeof mp.price === "number" ? mp.price : 0;
    const byFlat = typeof mp.discountPrice === "number" ? mp.discountPrice : undefined;
    const byPercent =
      typeof mp.inventory?.discountPercent === "number"
        ? Math.round(original * (1 - mp.inventory.discountPercent / 100))
        : undefined;
    const final = byFlat ?? byPercent ?? original;
    const discountPercent =
      typeof mp.inventory?.discountPercent === "number"
        ? mp.inventory.discountPercent
        : byFlat !== undefined
        ? Math.round((1 - final / original) * 100)
        : undefined;
    return { final, original, discountPercent, hasDiscount: final < original };
  }

  const priceInfo = variantSelected
    ? getVariantPriceInfo(activeVariant)
    : getProductPriceInfo(product);
  const finalPrice = priceInfo?.final ?? 0;
  const originalPrice = priceInfo?.original ?? 0;
  const hasDiscount = !!priceInfo?.hasDiscount;
  const discountPercent = priceInfo?.discountPercent;

  const outOfStock = activeVariant ? isOutOfStock(activeVariant) : false;

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);

  // Build cart item with variant info
  function buildCartItem() {
    if (activeVariant) {
      const variantLabel = (activeVariant.attributes ?? [])
        .map((a) => a.value)
        .join(" / ");
      const price =
        getVariantPriceInfo(activeVariant)?.final ?? activeVariant.price;

      return {
        id: activeVariant.id,
        productId: product.id,
        variantId: activeVariant.id,
        name: product.name,
        variantLabel,
        price,
        image:
          (activeVariant.images?.[0] as string | undefined) ??
          product.thumbnailUrl ??
          (product.images?.[0] as string | undefined),
        quantity: 1,
        sku: activeVariant.sku,
      };
    }

    // Base product (no variants)
    return {
      id: product.id,
      productId: product.id,
      variantId: product.id,
      name: product.name,
      variantLabel: "",
      price: finalPrice,
      image:
        product.thumbnailUrl ??
        (Array.isArray(product.images) ? product.images[0] : undefined),
      quantity: 1,
      sku: undefined,
    };
  }

  async function handleAddToCart() {
    if (outOfStock || isAdding) return;
    setIsAdding(true);

    const item = buildCartItem();
    if (item) addItem(item);

    await new Promise((r) => setTimeout(r, 300));
    setIsAdding(false);
    openCart();
  }

  function handleBuyNow() {
    if (outOfStock) return;
    const item = buildCartItem();
    if (item) addItem(item);
    openCart();
  }

  return (
    <div className="product-detail">
      {/* Price Block */}
      <div className="product-detail__price-block">
      <span className="product-detail__price">
        ₹{finalPrice.toLocaleString("en-IN")}
      </span>

      {hasDiscount && (
        <div className="product-detail__price-meta">
          <span className="product-detail__price-original">
            ₹{originalPrice.toLocaleString("en-IN")}
          </span>
          <span className="product-detail__discount-badge">
            {typeof discountPercent === "number"
              ? `(${discountPercent}% OFF)`
              : `(₹${(originalPrice - finalPrice).toLocaleString("en-IN")} OFF)`}
          </span>
        </div>
      )}
    </div>


      {/* Stock Status */}
      <div className="product-detail__stock">
        {variants.length === 0 ? (
          <span className="product-detail__stock--in">
            In Stock — Ready to Ship
          </span>
        ) : variantSelected ? (
          outOfStock ? (
            <span className="product-detail__stock--out">
              Out of Stock
            </span>
          ) : (
            <span className="product-detail__stock--in">
              In Stock — Ready to Ship
            </span>
          )
        ) : (
          <span className="product-detail__stock--in">
            Select a variant to view stock
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="product-detail__divider" />

      {/* Variants */}
      {variants.length > 1 && (
        <div className="product-detail__section">
          <span className="product-detail__label">Select Option</span>
          <ProductVariantBlock
            product={{ ...product, variants } as Product}
            selectedVariant={selectedVariant ?? undefined}
            onChange={setVariant}
          />
        </div>
      )}

      {/* Primary Actions */}
      <div className="product-detail__actions">
        <button
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="product-detail__btn-primary"
        >
          Buy Now
        </button>

        <button
          onClick={handleAddToCart}
          disabled={outOfStock || isAdding}
          className="product-detail__btn-secondary"
        >
          {isAdding ? "Adding..." : "Add to Cart"}
        </button>
      </div>

      {/* Marketplace Buttons */}
      {(product.marketplaces?.amazon ||
        product.marketplaces?.flipkart ||
        product.marketplaces?.meesho) && (
        <div className="product-detail__marketplaces">
          <span className="product-detail__label">Also available on</span>
          <div className="product-detail__marketplace-links">
            {product.marketplaces?.amazon && (
              <a
                href={product.marketplaces.amazon}
                target="_blank"
                rel="noopener noreferrer"
                className="product-detail__marketplace-btn product-detail__marketplace-btn--amazon"
              >
                <FaAmazon className="w-5 h-5" />
                Amazon
              </a>
            )}
            {product.marketplaces?.flipkart && (
              <a
                href={product.marketplaces.flipkart}
                target="_blank"
                rel="noopener noreferrer"
                className="product-detail__marketplace-btn product-detail__marketplace-btn--flipkart"
              >
                <SiFlipkart className="w-5 h-5" />
                Flipkart
              </a>
            )}
            {product.marketplaces?.meesho && (
              <a
                href={product.marketplaces.meesho}
                target="_blank"
                rel="noopener noreferrer"
                className="product-detail__marketplace-btn product-detail__marketplace-btn--meesho"
              >
                <FaShoppingBag className="w-4 h-4" />
                Meesho
              </a>
            )}
          </div>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="product-detail__trust">
        <div className="product-detail__trust-item">
          Authentic Product
        </div>
        <div className="product-detail__trust-item">
          Secure Payments
        </div>
        <div className="product-detail__trust-item">
          Free Shipping
        </div>
      </div>

      {/* Wishlist / Share */}
      <ProductActions
        product={product}
        selectedVariant={activeVariant ?? undefined}
      />
    </div>
  );
}
