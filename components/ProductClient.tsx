"use client";

import { useEffect, useState } from "react";
import type { Product, Variant } from "../types/products";
import { isOutOfStock } from "../libs/pricing";
import ProductVariantBlock from "./ProductVariantBlock";
import ProductActions from "./ProductActions";
import { useCartStore } from "@/store/useCartStore";
import { useBuyNowStore } from "@/store/useBuyNowStore";
import { useRouter } from "next/navigation";
import { FaAmazon, FaShoppingBag } from "react-icons/fa";
import { SiFlipkart } from "react-icons/si";
import { useProductVariant } from "@/hooks/useProductVariant";
import { track } from "@/utils/analytics";
import { useAppConfigStore } from "@/store/useAppStore";
import { CreditCard, Landmark, ShieldCheck, Smartphone, Wallet } from "lucide-react";

export default function ProductClient({ product }: { product: Product }) {
  const router = useRouter();
  const { selectedVariant, setVariant, initializeProduct } = useProductVariant();
  const [isAdding, setIsAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [pincode, setPincode] = useState("");
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeResult, setPincodeResult] = useState<null | { serviceable: boolean; message?: string }>(null);

  function showNotification(message: string) {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }

  useEffect(() => {
    initializeProduct(product);
  }, [initializeProduct, product]);

  useEffect(() => {
    track("product_viewed", {
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      has_variants: Array.isArray(product.variants) && product.variants.length > 0,
    });
  }, [product.id, product.slug, product.name, product.variants]);

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
  const setBuyNowItem = useBuyNowStore((s) => s.setBuyNowItem);
  const freeShippingAbove = useAppConfigStore((s) => s.freeShippingAbove);

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
        shippingRate: product.shippingRate,
        image:
          (activeVariant.images?.[0] as string | undefined) ??
          product.thumbnailUrl ??
          (product.images?.[0] as string | undefined),
        quantity: 1,
        sku: activeVariant.sku,
        slug: product.slug,
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
      shippingRate: product.shippingRate,
      image:
        product.thumbnailUrl ??
        (Array.isArray(product.images) ? product.images[0] : undefined),
      quantity: 1,
      sku: undefined,
      slug: product.slug,
    };
  }

  async function handleAddToCart() {
    if (variants.length > 1 && !variantSelected) {
      showNotification("Please select a variant to continue");
      return;
    }

    if (outOfStock || isAdding) return;
    setIsAdding(true);

    const item = buildCartItem();
    if (item) {
      track("add_to_cart_clicked", {
        product_id: item.productId,
        variant_id: item.variantId,
        sku: item.sku,
        slug: item.slug,
        price: item.price,
        quantity: item.quantity,
        source: "product_page",
      });
      addItem(item);
    }

    await new Promise((r) => setTimeout(r, 300));
    setIsAdding(false);
    openCart();
  }

  function handleBuyNow() {
    if (variants.length > 1 && !variantSelected) {
      showNotification("Please select a variant to continue");
      return;
    }

    if (outOfStock) return;
    const item = buildCartItem();
    if (item) {
      track("begin_checkout", {
        product_id: item.productId,
        variant_id: item.variantId,
        sku: item.sku,
        slug: item.slug,
        price: item.price,
        quantity: item.quantity,
        source: "buy_now",
      });
      setBuyNowItem(item);
      router.push("/checkout/buy-now");
    }
  }

  async function checkServiceability() {
    const pin = pincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      setPincodeResult({ serviceable: false, message: "Enter a valid 6-digit pincode." });
      return;
    }

    setCheckingPincode(true);
    setPincodeResult(null);
    try {
      const resp = await fetch(
        `/api/shipping/nimbus/serviceability?pincode=${encodeURIComponent(pin)}`,
        { method: "GET" }
      );
      const json: unknown = await resp.json().catch(() => ({}));
      const obj = typeof json === "object" && json !== null ? (json as Record<string, unknown>) : {};
      if (!resp.ok) {
        const msg = typeof obj.error === "string" ? obj.error : "Failed to check pincode";
        setPincodeResult({ serviceable: false, message: msg });
        return;
      }

      const serviceable = Boolean(obj.serviceable);
      setPincodeResult({
        serviceable,
        message: serviceable ? "Delivery available to this pincode." : "Delivery not available to this pincode.",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null;
      setPincodeResult({ serviceable: false, message: msg || "Failed to check pincode" });
    } finally {
      setCheckingPincode(false);
    }
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
            onChange={(v) => {
              setVariant(v);
            }}
          />
        </div>
      )}

      <div className="product-detail__section">
        <span className="product-detail__label">Delivery</span>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") checkServiceability();
            }}
            inputMode="numeric"
            placeholder="Enter pincode"
            className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2 text-sm w-44"
            aria-label="Pincode"
          />
          <button
            onClick={checkServiceability}
            disabled={checkingPincode}
            className="px-4 py-2 rounded-xl border border-[rgba(var(--gold-rgb),0.35)] text-[rgb(var(--gold-rgb))] hover:bg-[rgba(var(--gold-rgb),0.08)] disabled:opacity-50 text-sm"
          >
            {checkingPincode ? "Checking..." : "Check"}
          </button>
        </div>

        {pincodeResult?.message && (
          <div
            className={`mt-3 text-sm ${
              pincodeResult.serviceable ? "text-green-400" : "text-red-300"
            }`}
          >
            {pincodeResult.message}
          </div>
        )}
      </div>

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
        <div
          className="product-detail__trust-item"
          style={{
            background: "rgba(var(--gold-rgb),0.12)",
            border: "1px solid rgba(var(--gold-rgb),0.28)",
            color: "rgb(var(--gold-rgb))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 14,
          }}
        >
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} />
            Secure payments via Razorpay
          </span>
          <span className="flex items-center gap-2" style={{ color: "var(--fg)" }}>
            <span className="flex items-center gap-1 text-xs">
              <Smartphone size={14} />
              UPI
            </span>
            <span className="flex items-center gap-1 text-xs">
              <CreditCard size={14} />
              Cards
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Landmark size={14} />
              Netbanking
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Wallet size={14} />
              Wallets
            </span>
          </span>
        </div>
        <div className="product-detail__trust-item">Easy returns & quick refunds</div>
        <div className="product-detail__trust-item">Transparent delivery timelines</div>
        <div className="product-detail__trust-item">
          {typeof freeShippingAbove === "number" && freeShippingAbove > 0
            ? `Free shipping over ₹${freeShippingAbove.toLocaleString("en-IN")}`
            : "Fast shipping across India"}
        </div>
      </div>

      <div className="text-xs mt-3" style={{ color: "var(--muted)" }}>
        <a href="/shipping-and-delivery" className="underline underline-offset-2">Shipping</a>
        {" • "}
        <a href="/returns-and-refunds" className="underline underline-offset-2">Returns</a>
        {" • "}
        <a href="/warranty-and-care" className="underline underline-offset-2">Warranty</a>
      </div>

      {/* Wishlist / Share */}
      <ProductActions
        product={product}
        selectedVariant={activeVariant ?? undefined}
      />

      {/* Toast Notification */}
      <div className={`toast ${showToast ? "toast--visible" : ""}`}>
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
