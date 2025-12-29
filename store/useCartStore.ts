import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;              // Unique cart item ID (variantId or productId-variantId)
  productId: string;       // Product document ID
  variantId: string;       // Variant ID
  name: string;            // Product name
  variantLabel: string;    // e.g. "Red / Large"
  price: number;           // Final price after discount
  image?: string;
  quantity: number;
  sku?: string;            // Variant SKU if available
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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      addItem: (item) =>
        set({
          items: (() => {
            // Match by variantId for proper variant tracking
            const existing = get().items.find((i) => i.variantId === item.variantId);
            if (existing) {
              return get().items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              );
            }
            return [...get().items, { ...item, id: item.variantId }];
          })(),
        }),

      removeItem: (id) =>
        set({
          items: get().items.filter((i) => i.id !== id),
        }),

      updateQty: (id, qty) =>
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: qty } : i
          ),
        }),

      clear: () => set({ items: [] }),

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
