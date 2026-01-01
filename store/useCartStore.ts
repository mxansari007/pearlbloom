import { create } from "zustand";
import { persist } from "zustand/middleware";
import { track } from "@/utils/analytics";

export interface CartItem {
  id: string;              // Unique cart item ID (variantId or productId-variantId)
  productId: string;       // Product document ID
  variantId: string;       // Variant ID
  name: string;            // Product name
  variantLabel: string;    // e.g. "Red / Large"
  price: number;           // Final price after discount
  shippingRate?: number;   // Optional per-item shipping rate (falls back to global)
  image?: string;
  quantity: number;
  sku?: string;            // Variant SKU if available
  slug?: string;           // Product slug
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  open: () => void;
  close: () => void;

  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;

  // Helper to get total
  getTotal: () => number;
  getItemCount: () => number;
}

function summarizeCart(items: CartItem[]) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartValue = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return {
    cart_item_count: itemCount,
    cart_unique_items: items.length,
    cart_value: cartValue,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      open: () => {
        set({ isOpen: true });
        track("cart_opened", summarizeCart(get().items));
      },
      close: () => {
        set({ isOpen: false });
        track("cart_closed", summarizeCart(get().items));
      },

      addItem: (item) => {
        const prevItems = get().items;
        const existing = prevItems.find((i) => i.variantId === item.variantId);
        const nextItems = existing
          ? prevItems.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          : [...prevItems, { ...item, id: item.variantId }];

        set({ items: nextItems });

        track("cart_item_added", {
          product_id: item.productId,
          variant_id: item.variantId,
          sku: item.sku,
          slug: item.slug,
          price: item.price,
          quantity: item.quantity,
          ...summarizeCart(nextItems),
        });
      },

      removeItem: (id) => {
        const prevItems = get().items;
        const removed = prevItems.find((i) => i.id === id);
        const nextItems = prevItems.filter((i) => i.id !== id);
        set({ items: nextItems });

        track("cart_item_removed", {
          product_id: removed?.productId,
          variant_id: removed?.variantId,
          sku: removed?.sku,
          slug: removed?.slug,
          price: removed?.price,
          quantity: removed?.quantity,
          ...summarizeCart(nextItems),
        });
      },

      updateQty: (id, qty) => {
        const prevItems = get().items;
        const current = prevItems.find((i) => i.id === id);
        if (!current) return;

        if (qty <= 0) {
          const nextItems = prevItems.filter((i) => i.id !== id);
          set({ items: nextItems });
          track("cart_item_removed", {
            product_id: current.productId,
            variant_id: current.variantId,
            sku: current.sku,
            slug: current.slug,
            price: current.price,
            quantity: current.quantity,
            ...summarizeCart(nextItems),
          });
          return;
        }

        const nextItems = prevItems.map((i) =>
          i.id === id ? { ...i, quantity: qty } : i
        );
        set({ items: nextItems });

        track("cart_quantity_updated", {
          product_id: current.productId,
          variant_id: current.variantId,
          sku: current.sku,
          slug: current.slug,
          price: current.price,
          previous_quantity: current.quantity,
          quantity: qty,
          ...summarizeCart(nextItems),
        });
      },

      clear: () => {
        const prevItems = get().items;
        set({ items: [] });
        track("cart_cleared", summarizeCart(prevItems));
      },

      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "pearlbloom-cart",
    }
  )
);
