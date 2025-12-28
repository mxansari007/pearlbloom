import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
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
            const existing = get().items.find((i) => i.id === item.id);
            if (existing) {
              return get().items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              );
            }
            return [...get().items, item];
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
    }),
    {
      name: "pearlbloom-cart",
    }
  )
);
