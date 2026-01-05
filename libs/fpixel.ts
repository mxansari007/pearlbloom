"use client";

import { useAppConfigStore } from "@/store/useAppStore";

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

type FbqFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: FbqFn;
    __pbFbqQueue?: unknown[][];
    __pbLastPurchaseEventId?: string;
  }
}

function trackingAllowed() {
  const { configLoaded, testMode } = useAppConfigStore.getState();
  return configLoaded && !testMode;
}

function pixelEnabled() {
  return Boolean(FB_PIXEL_ID) && trackingAllowed();
}

function sendFbq(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq === "function") {
    window.fbq(...args);
    return;
  }
  window.__pbFbqQueue = window.__pbFbqQueue || [];
  window.__pbFbqQueue.push(args);
}

export const pageview = () => {
  if (!pixelEnabled()) return;
  sendFbq("track", "PageView");
};

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options: Record<string, unknown> = {}) => {
  if (!pixelEnabled()) return;
  sendFbq("trackCustom", name, options);
};

export const trackFromPosthog = (eventName: string, props: Record<string, unknown> = {}) => {
  if (!pixelEnabled()) return;

  const currency = "INR";
  const getNumber = (v: unknown) => {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };

  const productId = typeof props.product_id === "string" ? props.product_id : undefined;
  const productName = typeof props.name === "string" ? props.name : undefined;
  const value = getNumber(props.price) ?? getNumber(props.cart_value);
  const quantity = getNumber(props.quantity);

  const standard = (() => {
    switch (eventName) {
      case "product_viewed":
        return { name: "ViewContent", payload: { content_ids: productId ? [productId] : undefined, content_name: productName, content_type: "product", value, currency } };
      case "add_to_cart_clicked":
      case "cart_item_added":
        return { name: "AddToCart", payload: { content_ids: productId ? [productId] : undefined, content_name: productName, content_type: "product", value, currency, num_items: quantity } };
      case "begin_checkout":
      case "checkout_submitted":
        return { name: "InitiateCheckout", payload: { value: getNumber(props.cart_value) ?? value, currency, num_items: getNumber(props.cart_item_count) } };
      case "wishlist_item_added":
        return { name: "AddToWishlist", payload: { content_ids: productId ? [productId] : undefined, content_name: productName, content_type: "product", value, currency } };
      case "payment_succeeded":
      case "order_created":
      case "order_success_viewed":
        return null;
      default:
        return null;
    }
  })();

  if (eventName === "payment_succeeded") {
    const orderId = typeof props.order_id === "string" ? props.order_id : undefined;
    // Priority: total (final amount) > cart_value (subtotal) > value (fallback)
    const purchaseValue = getNumber(props.total) ?? getNumber(props.cart_value) ?? value;
    if (!purchaseValue) return; // Don't send if no value
    if (orderId) {
      const eventId = `purchase_${orderId}`;
      if (window.__pbLastPurchaseEventId === eventId) return;
      window.__pbLastPurchaseEventId = eventId;
      sendFbq("track", "Purchase", { value: purchaseValue, currency }, { eventID: eventId });
      return;
    }
    sendFbq("track", "Purchase", { value: purchaseValue, currency });
    return;
  }

  if (standard) {
    const payload: Record<string, unknown> = {};
    Object.entries(standard.payload).forEach(([k, v]) => {
      if (v !== undefined) payload[k] = v;
    });
    sendFbq("track", standard.name, payload);
    return;
  }

  const customPayload: Record<string, unknown> = {};
  Object.entries(props).forEach(([k, v]) => {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      customPayload[k] = v;
    }
  });
  sendFbq("trackCustom", eventName, customPayload);
};

export {};
