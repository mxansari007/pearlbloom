"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, Variant } from "../types/products";
import {
  isOutOfStock,
  isProductOutOfStock,
  getVariantStockLevel,
  getProductStockLevel,
  type StockLevel,
} from "../libs/pricing";
import ProductVariantBlock from "./ProductVariantBlock";
import ProductActions from "./ProductActions";
import WishlistButton from "./product/WishlistButton";
import { useCartStore } from "@/store/useCartStore";
import { useBuyNowStore } from "@/store/useBuyNowStore";
import { useAppConfigStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import { FaAmazon, FaShoppingBag } from "react-icons/fa";
import { SiFlipkart } from "react-icons/si";
import { useProductVariant } from "@/hooks/useProductVariant";
import { track } from "@/utils/analytics";
import {
  CreditCard,
  Landmark,
  ShieldCheck,
  Smartphone,
  Wallet,
  Sparkles,
  Minus,
  Plus,
  Star,
  Truck,
  Clock,
  CheckCircle2,
  PackageCheck,
} from "lucide-react";
import {
  resolveFeatureIcon,
  DEFAULT_FEATURE_BADGES,
} from "./product/featureIcons";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/* Same-day dispatch cut-off (IST). Orders before this dispatch the same day.
   The cut-off is admin-configurable per product (product.dispatchTimer); this
   is only the fallback used when a product has no timer set. */
const DEFAULT_CUTOFF_HOUR = 17; // 5:00 PM IST
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getDispatchInfo(nowMs: number, cutoffHour: number, cutoffMinute: number) {
  // Shift to IST wall-clock by reading UTC fields of an offset date.
  const ist = new Date(nowMs + IST_OFFSET_MS);
  const secondsNow =
    ist.getUTCHours() * 3600 + ist.getUTCMinutes() * 60 + ist.getUTCSeconds();
  const cutoff = cutoffHour * 3600 + cutoffMinute * 60;
  if (secondsNow < cutoff) {
    return { beforeCutoff: true, secondsLeft: cutoff - secondsNow };
  }
  return { beforeCutoff: false, secondsLeft: 0 };
}

function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function ProductClient({
  product,
  reviewAverage = 0,
  reviewCount = 0,
  sku = null,
}: {
  product: Product;
  reviewAverage?: number;
  reviewCount?: number;
  sku?: string | null;
}) {
  const router = useRouter();
  const { selectedVariant, setVariant, initializeProduct } = useProductVariant();

  const [isAdding, setIsAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [pincode, setPincode] = useState("");
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeResult, setPincodeResult] = useState<
    null | { serviceable: boolean; message?: string }
  >(null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"materials" | "returns">("materials");

  // Client-only clock for the real dispatch countdown (hydration-safe).
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState(0);

  // Storefront runtime config (free-shipping threshold, returns/exchange days…).
  const freeShippingAbove = useAppConfigStore((s) => s.freeShippingAbove);
  const codEnabled = useAppConfigStore((s) => s.codEnabled);
  const configLoaded = useAppConfigStore((s) => s.configLoaded);
  const loadConfig = useAppConfigStore((s) => s.loadConfig);

  // Persisted config (zustand `persist`) rehydrates from localStorage on the
  // client BEFORE React hydrates, while the server renders with store defaults.
  // Reading it directly during render would make the server HTML and the
  // client's first render differ (e.g. the free-shipping bar appearing only on
  // the client), which aborts hydration of this whole subtree. Gate every
  // config-derived branch behind `mounted` so both first renders are identical,
  // then reveal the real values after mount.
  const freeShippingAboveView = mounted ? freeShippingAbove : null;
  const codEnabledView = mounted ? codEnabled : false;

  function showNotification(message: string) {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }

  useEffect(() => {
    initializeProduct(product);
  }, [initializeProduct, product]);

  useEffect(() => {
    if (!configLoaded) loadConfig();
  }, [configLoaded, loadConfig]);

  useEffect(() => {
    setMounted(true);
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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
  const needsVariantChoice = variants.length > 1 && !variantSelected;

  type MaybeDiscountVariant = Variant & {
    discountPrice?: number;
    discountPercent?: number;
  };
  type MaybeDiscountProduct = Product & {
    price?: number;
    discountPrice?: number;
    inventory?: { discountPercent?: number };
  };

  function getVariantPriceInfo(v: Variant | null | undefined) {
    if (!v) return null;
    const mv = v as MaybeDiscountVariant;
    const original = v.price ?? 0;
    const byFlat =
      typeof mv.discountPrice === "number" ? mv.discountPrice : undefined;
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
    const byFlat =
      typeof mp.discountPrice === "number" ? mp.discountPrice : undefined;
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
  const discountPercent = priceInfo?.discountPercent ?? 0;
  const savedAmount = hasDiscount ? Math.max(0, originalPrice - finalPrice) : 0;

  const outOfStock =
    variants.length === 0
      ? isProductOutOfStock(product)
      : activeVariant
        ? isOutOfStock(activeVariant)
        : false;

  // Real stock level → honest "only N left" + quantity cap. Never invented.
  const stockLevel: StockLevel = activeVariant
    ? getVariantStockLevel(activeVariant)
    : variants.length === 0
      ? getProductStockLevel(product)
      : { tracked: false, quantity: null, lowStockThreshold: null };

  const lowStockThreshold = stockLevel.lowStockThreshold ?? 5;
  const isLowStock =
    stockLevel.tracked &&
    typeof stockLevel.quantity === "number" &&
    stockLevel.quantity > 0 &&
    stockLevel.quantity <= lowStockThreshold;

  const maxQty =
    stockLevel.tracked && typeof stockLevel.quantity === "number" && stockLevel.quantity > 0
      ? Math.min(10, stockLevel.quantity)
      : 10;

  // Keep qty within bounds when the variant/stock changes.
  useEffect(() => {
    setQty((q) => Math.min(Math.max(1, q), Math.max(1, maxQty)));
  }, [maxQty]);

  // Admin-configurable same-day dispatch timer (falls back to 5:00 PM IST).
  const timer = product.dispatchTimer;
  const timerEnabled = timer ? timer.enabled !== false : true;
  const cutoffHour =
    typeof timer?.cutoffHour === "number" ? timer.cutoffHour : DEFAULT_CUTOFF_HOUR;
  const cutoffMinute =
    typeof timer?.cutoffMinute === "number" ? timer.cutoffMinute : 0;
  const dispatchLabel = timer?.label?.trim() || "for same-day dispatch";

  const dispatch = useMemo(
    () => getDispatchInfo(nowMs, cutoffHour, cutoffMinute),
    [nowMs, cutoffHour, cutoffMinute]
  );

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const setBuyNowItem = useBuyNowStore((s) => s.setBuyNowItem);

  // Free-shipping progress (only when a real threshold is configured).
  const cartLineTotal = finalPrice * qty;
  const freeShipActive =
    typeof freeShippingAboveView === "number" && freeShippingAboveView > 0;
  const freeShipQualified =
    freeShipActive && cartLineTotal >= (freeShippingAboveView as number);
  const freeShipRemaining = freeShipActive
    ? Math.max(0, (freeShippingAboveView as number) - cartLineTotal)
    : 0;
  const freeShipPct = freeShipActive
    ? Math.min(100, Math.round((cartLineTotal / (freeShippingAboveView as number)) * 100))
    : 0;

  const hasRealRating = reviewCount > 0 && reviewAverage > 0;

  function buildCartItem() {
    if (activeVariant) {
      const variantLabel = (activeVariant.attributes ?? [])
        .map((a) => a.value)
        .join(" / ");
      const price = getVariantPriceInfo(activeVariant)?.final ?? activeVariant.price;

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
        quantity: qty,
        sku: activeVariant.sku,
        slug: product.slug,
      };
    }

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
      quantity: qty,
      sku: undefined,
      slug: product.slug,
    };
  }

  async function handleAddToCart() {
    if (needsVariantChoice) {
      showNotification("Please select an option to continue");
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
    if (needsVariantChoice) {
      showNotification("Please select an option to continue");
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
      setPincodeResult({
        serviceable: false,
        message: "Enter a valid 6-digit pincode.",
      });
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
      const obj =
        typeof json === "object" && json !== null
          ? (json as Record<string, unknown>)
          : {};
      if (!resp.ok) {
        const msg =
          typeof obj.error === "string" ? obj.error : "Failed to check pincode";
        setPincodeResult({ serviceable: false, message: msg });
        return;
      }
      const serviceable = Boolean(obj.serviceable);
      setPincodeResult({
        serviceable,
        message: serviceable
          ? "Delivery available to this pincode."
          : "Delivery not available to this pincode.",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null;
      setPincodeResult({
        serviceable: false,
        message: msg || "Failed to check pincode",
      });
    } finally {
      setCheckingPincode(false);
    }
  }

  const brandName = product.brand?.trim() || "PearlBloom";
  const subtitle =
    product.shortDescription?.trim() ||
    "Anti-tarnish, skin-safe and lightweight — meticulously hand-finished for everyday wear.";

  // Honest spec rows for the Materials tab: real attributes first, then a
  // truthful fallback set (no "surgical grade", no "real gold", no fake microns).
  const specRows = (product.attributes ?? [])
    .filter((a) => a.key?.toLowerCase() !== "sku")
    .filter((a) => a.key?.trim() || a.value?.trim());

  // Admin-configurable feature badges; fall back to honest defaults when unset
  // so existing products keep the original design until edited.
  const featureCards = (
    product.featureBadges && product.featureBadges.length > 0
      ? product.featureBadges
      : DEFAULT_FEATURE_BADGES
  ).filter((b) => b && b.title?.trim());

  const payChips = [
    { icon: <Smartphone size={15} />, label: "UPI" },
    { icon: <CreditCard size={15} />, label: "Cards" },
    { icon: <Landmark size={15} />, label: "Netbanking" },
    { icon: <Wallet size={15} />, label: "Wallets" },
  ];

  return (
    <div className="pdp-buybox">
      {/* Brand + identity */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{
            background: "rgba(var(--gold-rgb),0.12)",
            color: "rgb(var(--gold-rgb))",
            border: "1px solid rgba(var(--gold-rgb),0.28)",
          }}
        >
          <Sparkles size={12} /> by {brandName}
        </span>
        <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Luxury Demi-Fine Essentials
        </span>
      </div>

      {/* Title */}
      <h1
        className="mt-3 font-semibold leading-[1.15] tracking-[-0.01em]"
        style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--fg)", fontSize: "clamp(1.1625rem, 2.55vw, 1.6125rem)" }}
      >
        {product.name}
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-sm md:text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {subtitle}
      </p>

      {/* Honest trust chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[13px]">
        {hasRealRating ? (
          <a href="#reviews" className="inline-flex items-center gap-1.5 font-semibold" style={{ color: "rgb(var(--gold-rgb))" }}>
            <span className="inline-flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.round(reviewAverage) ? "currentColor" : "none"}
                  strokeWidth={1.5}
                />
              ))}
            </span>
            <span style={{ color: "var(--fg)" }}>{reviewAverage.toFixed(1)}</span>
            <span style={{ color: "var(--success-color, #16a34a)" }}>
              · {reviewCount} verified {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
            <Sparkles size={14} style={{ color: "rgb(var(--gold-rgb))" }} /> New arrival
          </span>
        )}
        <span aria-hidden style={{ color: "var(--muted)", opacity: 0.5 }}>•</span>
        <span className="inline-flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
          <CheckCircle2 size={14} style={{ color: "var(--success-color, #16a34a)" }} />
          Skin-safe &amp; lightweight
        </span>
      </div>

      {/* Price card */}
      <div
        className="mt-5 rounded-2xl p-4 md:p-5"
        style={{ background: "var(--price-card-bg)", border: "1px solid var(--card-border)" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Honest Everyday Price
        </p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-3xl md:text-[2.1rem] font-bold leading-none" style={{ color: "var(--fg)" }}>
            {inr(finalPrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-lg line-through" style={{ color: "var(--muted)" }}>
                MRP {inr(originalPrice)}
              </span>
              {discountPercent > 0 && (
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
                  style={{ background: "rgba(22,163,74,0.14)", color: "var(--success-color, #16a34a)" }}
                >
                  Save {discountPercent}%
                </span>
              )}
            </>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--muted)" }}>
          {hasDiscount && savedAmount > 0 && (
            <span className="font-semibold" style={{ color: "var(--success-color, #16a34a)" }}>
              You save {inr(savedAmount)}
            </span>
          )}
          <span>Inclusive of all taxes{hasDiscount ? "" : " · Honest everyday value"}</span>
        </div>

        {/* Stock + dispatch line */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {outOfStock ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(239,68,68,0.12)", color: "var(--error-color, #ef4444)" }}
            >
              ● Sold Out
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(22,163,74,0.12)", color: "var(--success-color, #16a34a)" }}
            >
              <CheckCircle2 size={13} />
              In Stock —{" "}
              {mounted && timerEnabled
                ? dispatch.beforeCutoff
                  ? "Dispatches Today"
                  : "Dispatches Tomorrow"
                : "Ready to Ship"}
            </span>
          )}
          {!outOfStock && isLowStock && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(245,158,11,0.14)", color: "var(--warning-color, #f59e0b)" }}
            >
              🔥 Only {stockLevel.quantity} left
            </span>
          )}
        </div>
      </div>

      {/* Free-shipping progress (only with a real threshold) */}
      {freeShipActive && !outOfStock && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: "var(--fg)" }}>
            <Truck size={15} style={{ color: "rgb(var(--gold-rgb))" }} />
            {freeShipQualified ? (
              <span>You&apos;ve unlocked <strong>FREE shipping</strong> 🎉</span>
            ) : (
              <span>
                Add <strong>{inr(freeShipRemaining)}</strong> more for <strong>FREE shipping</strong>
              </span>
            )}
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--card-border)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${freeShipQualified ? 100 : freeShipPct}%`,
                background: "linear-gradient(90deg, rgb(var(--gold-rgb)), var(--success-color, #16a34a))",
              }}
            />
          </div>
        </div>
      )}

      {/* Variant selector */}
      {variants.length > 1 && (
        <div className="mt-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
            Select Option
          </span>
          <div className="mt-2">
            <ProductVariantBlock
              product={{ ...product, variants } as Product}
              selectedVariant={selectedVariant ?? undefined}
              onChange={(v) => setVariant(v)}
            />
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="mt-5 flex items-center gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Quantity
        </span>
        <div
          className="inline-flex items-center rounded-xl"
          style={{ border: "1px solid var(--card-border)", background: "var(--card-bg-soft)" }}
        >
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="grid h-10 w-10 place-items-center rounded-l-xl disabled:opacity-40"
            style={{ color: "var(--fg)" }}
          >
            <Minus size={15} />
          </button>
          <span className="w-10 text-center text-sm font-semibold tabular-nums" style={{ color: "var(--fg)" }}>
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            aria-label="Increase quantity"
            className="grid h-10 w-10 place-items-center rounded-r-xl disabled:opacity-40"
            style={{ color: "var(--fg)" }}
          >
            <Plus size={15} />
          </button>
        </div>
        {stockLevel.tracked && typeof stockLevel.quantity === "number" && stockLevel.quantity > 0 && (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {stockLevel.quantity} available
          </span>
        )}
      </div>

      {/* Real same-day dispatch countdown (admin-toggleable per product) */}
      {!outOfStock && mounted && timerEnabled && dispatch.beforeCutoff && (
        <div
          className="mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px]"
          style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.28)", color: "var(--fg)" }}
        >
          <Clock size={15} style={{ color: "var(--warning-color, #f59e0b)" }} />
          <span>
            Order within{" "}
            <strong className="tabular-nums" style={{ color: "var(--warning-color, #f59e0b)" }}>
              {formatHMS(dispatch.secondsLeft)}
            </strong>{" "}
            {dispatchLabel}
          </span>
        </div>
      )}
      {!outOfStock && mounted && timerEnabled && !dispatch.beforeCutoff && (
        <p className="mt-4 flex items-center gap-2 text-[13px]" style={{ color: "var(--muted)" }}>
          <Clock size={15} /> Order now — dispatches next business day
        </p>
      )}

      {/* Primary CTAs */}
      <div className="mt-5 space-y-3">
        <div className="flex items-stretch gap-3">
          <WishlistButton product={product} selectedVariant={activeVariant ?? undefined} />
          <button
            onClick={handleAddToCart}
            disabled={outOfStock || isAdding}
            className="group relative flex-1 overflow-hidden rounded-2xl px-6 py-4 text-[15px] font-bold uppercase tracking-[0.06em] transition-all duration-300 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: outOfStock
                ? "var(--card-border)"
                : "linear-gradient(135deg, #241a1d 0%, rgb(var(--wine-rgb)) 100%)",
              color: outOfStock ? "var(--muted)" : "#f7ede0",
              boxShadow: outOfStock ? "none" : "0 10px 28px -12px rgba(var(--wine-rgb),0.7)",
            }}
          >
            {outOfStock
              ? "Sold Out"
              : isAdding
                ? "Adding…"
                : (
                  <span className="inline-flex items-center justify-center gap-2">
                    Add to Bag{hasDiscount ? ` · Save ${discountPercent}%` : ""}
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">›</span>
                  </span>
                )}
          </button>
        </div>

        <button
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="buy-now-btn group w-full overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.06em] active:scale-[0.99]"
        >
          <span className="inline-flex items-center justify-center gap-2">
            Buy Now
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">›</span>
          </span>
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
          <ShieldCheck size={13} style={{ color: "var(--success-color, #16a34a)" }} />
          Secure checkout · Pay by UPI, Cards, Netbanking &amp; Wallets
        </p>
      </div>

      {/* Encrypted Razorpay secure-checkout card */}
      <div
        className="mt-5 rounded-2xl p-4"
        style={{ background: "var(--card-bg-soft)", border: "1px solid var(--card-border)" }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--fg)" }}>
          <ShieldCheck size={17} style={{ color: "var(--success-color, #16a34a)" }} />
          Encrypted Razorpay Secure Checkout
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {payChips.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
              style={{ background: "var(--panel)", border: "1px solid var(--card-border)", color: "var(--fg)" }}
            >
              <span style={{ color: "rgb(var(--gold-rgb))" }}>{c.icon}</span>
              {c.label}
            </div>
          ))}
        </div>
        {codEnabledView && (
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            Cash on Delivery available at checkout.
          </p>
        )}
      </div>

      {/* Feature cards */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {featureCards.map((f, i) => (
          <div
            key={`${f.title}-${i}`}
            className={`pdp-acard rounded-2xl${f.highlight ? " pdp-acard--gold" : ""}`}
            style={{ padding: "0.85rem" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`pdp-acard__icon${f.highlight ? " pdp-acard__icon--gold" : ""} grid h-8 w-8 shrink-0 place-items-center rounded-full`}
              >
                {resolveFeatureIcon(f.icon, 14)}
              </span>
              <p
                className="font-semibold leading-tight"
                style={{ color: "var(--fg)", fontSize: "0.8rem", transform: "translateY(5px)" }}
              >
                {f.title}
              </p>
            </div>
            {f.subtitle?.trim() && (
              <p className="mt-2 leading-snug" style={{ color: "var(--muted)", fontSize: "0.68rem", transform: "translateY(3px)" }}>
                {f.subtitle}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs: Materials & Dimensions / Returns */}
      <div className="mt-6">
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--card-bg-soft)", border: "1px solid var(--card-border)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("materials")}
            className={`pdp-tab${activeTab === "materials" ? " pdp-tab--active" : ""}`}
          >
            Materials &amp; Dimensions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("returns")}
            className={`pdp-tab${activeTab === "returns" ? " pdp-tab--active" : ""}`}
          >
            Returns &amp; Care
          </button>
        </div>

        {/* Both panels stay in the DOM for SEO; inactive one is hidden. */}
        <div className="mt-3 text-sm" hidden={activeTab !== "materials"}>
          {product.description?.trim() && (
            <div className="mb-5">
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="inline-block h-3 w-3 rotate-45 rounded-[2px]"
                  style={{ background: "linear-gradient(135deg, rgb(var(--gold-rgb)), #e6c547)" }}
                />
                <span className="font-display text-base" style={{ color: "var(--fg)" }}>
                  About This Piece
                </span>
                <span
                  className="h-px flex-1"
                  style={{ background: "linear-gradient(90deg, rgba(var(--gold-rgb),0.35), transparent)" }}
                />
              </div>
              <div className="space-y-3">
                {product.description
                  .split(/\n+/)
                  .map((para) => para.trim())
                  .filter(Boolean)
                  .map((para, idx) => (
                    <p
                      key={idx}
                      className="leading-relaxed"
                      style={{ color: "var(--muted)", fontSize: "0.9rem" }}
                    >
                      {para}
                    </p>
                  ))}
              </div>
            </div>
          )}
          {(() => {
            const rows: [string, string][] =
              specRows.length > 0
                ? specRows.map((a) => [a.key, a.value])
                : [
                    ["Base Material", "Skin-safe alloy (lead & nickel free)"],
                    ["Surface Plating", "18K gold-tone plating"],
                    ["Finish", "Anti-tarnish, water-resistant"],
                    ["Weight", "Lightweight, everyday comfort"],
                  ];
            if (sku) rows.push(["SKU", sku]);
            return (
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  border: "1px solid var(--card-border)",
                  background: "var(--price-card-bg)",
                  boxShadow: "0 18px 44px -30px rgba(44,10,20,0.45)",
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{
                    background: "linear-gradient(90deg, rgba(var(--gold-rgb),0.12), transparent 70%)",
                    borderBottom: "1px solid rgba(var(--gold-rgb),0.20)",
                  }}
                >
                  <span
                    className="inline-block h-3 w-3 rotate-45 rounded-[2px]"
                    style={{ background: "linear-gradient(135deg, rgb(var(--gold-rgb)), #e6c547)" }}
                  />
                  <span className="font-display text-base" style={{ color: "var(--fg)" }}>
                    Product Details
                  </span>
                </div>

                <ul>
                  {rows.map(([k, v], i) => (
                    <li
                      key={`${k}-${i}`}
                      className="flex items-baseline justify-between gap-5 px-4 py-1.5"
                      style={{ background: "transparent" }}
                    >
                      {k ? (
                        <>
                          <span className="flex shrink-0 items-center gap-2">
                            <span
                              className="inline-block h-1 w-1 rounded-full"
                              style={{ background: "rgb(var(--gold-rgb))" }}
                            />
                            <span
                              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                              style={{ color: "var(--muted)" }}
                            >
                              {k}
                            </span>
                          </span>
                          <span className="text-right font-medium" style={{ color: "var(--fg)", fontSize: "13.5px" }}>
                            {v}
                          </span>
                        </>
                      ) : (
                        <span className="ml-auto text-right font-medium" style={{ color: "var(--fg)", fontSize: "13.5px" }}>
                          {v}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>

        <div className="mt-3 text-sm" hidden={activeTab !== "returns"}>
          <div className="flex items-start gap-2.5">
            <PackageCheck size={18} className="mt-0.5 shrink-0" style={{ color: "var(--success-color, #16a34a)" }} />
            <div className="space-y-1.5" style={{ color: "var(--muted)" }}>
              <p>
                <strong style={{ color: "var(--fg)" }}>🛡️ 48-Hour Return Protection Plan.</strong>{" "}
                If your order arrives damaged, defective, or incorrect, report it within{" "}
                <strong style={{ color: "var(--fg)" }}>48 hours of delivery</strong> and we&apos;ll
                arrange a free replacement.
              </p>
              <p>
                Just share a clear unboxing video and a couple of photos with your order ID so we can
                verify the claim. Change-of-mind returns aren&apos;t accepted, and worn earrings
                can&apos;t be returned for hygiene reasons.
              </p>
              <p>Anti-tarnish, water-resistant finish — wipe clean and store dry to keep the shine.</p>
              <p>
                <a href="/returns-and-refunds" className="underline" style={{ color: "rgb(var(--gold-rgb))" }}>
                  Read the full returns &amp; refunds policy ›
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery / pincode check */}
      <div className="mt-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
          Check Delivery
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") checkServiceability();
            }}
            inputMode="numeric"
            placeholder="Enter pincode"
            className="w-44 rounded-xl px-4 py-2.5 text-sm"
            style={{ border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--fg)" }}
            aria-label="Pincode"
          />
          <button
            onClick={checkServiceability}
            disabled={checkingPincode}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ border: "1px solid rgba(var(--gold-rgb),0.4)", color: "rgb(var(--gold-rgb))" }}
          >
            {checkingPincode ? "Checking…" : "Check"}
          </button>
        </div>
        {pincodeResult?.message && (
          <div
            className="mt-2 text-sm"
            style={{ color: pincodeResult.serviceable ? "var(--success-color, #16a34a)" : "var(--error-color, #ef4444)" }}
          >
            {pincodeResult.message}
          </div>
        )}
      </div>

      {/* Marketplaces */}
      {(product.marketplaces?.amazon ||
        product.marketplaces?.flipkart ||
        product.marketplaces?.meesho) && (
        <div className="mt-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
            Also available on
          </span>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {product.marketplaces?.amazon && (
              <a
                href={product.marketplaces.amazon}
                target="_blank"
                rel="noopener noreferrer"
                className="marketplace-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
              >
                <FaAmazon className="h-5 w-5" /> Amazon
              </a>
            )}
            {product.marketplaces?.flipkart && (
              <a
                href={product.marketplaces.flipkart}
                target="_blank"
                rel="noopener noreferrer"
                className="marketplace-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
              >
                <SiFlipkart className="h-5 w-5" /> Flipkart
              </a>
            )}
            {product.marketplaces?.meesho && (
              <a
                href={product.marketplaces.meesho}
                target="_blank"
                rel="noopener noreferrer"
                className="marketplace-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
              >
                <FaShoppingBag className="h-4 w-4" /> Meesho
              </a>
            )}
          </div>
        </div>
      )}

      {/* Policy links */}
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--muted)" }}>
        <a href="/shipping-and-delivery" className="hover:underline">Shipping Policy</a>
        <span aria-hidden style={{ opacity: 0.5 }}>•</span>
        <a href="/returns-and-refunds" className="hover:underline">Returns &amp; Refunds</a>
        <span aria-hidden style={{ opacity: 0.5 }}>•</span>
        <a href="/warranty-and-care" className="hover:underline">Warranty &amp; Care</a>
      </div>

      {/* Share / copy link */}
      <ProductActions product={product} />

      {/* Toast */}
      <div className={`toast ${showToast ? "toast--visible" : ""}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
