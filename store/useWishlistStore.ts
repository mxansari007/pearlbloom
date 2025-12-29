import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
};

type WishlistState = {
  items: WishlistItem[];

  add: (item: WishlistItem) => void;
  update: (id: string, updates: Partial<WishlistItem>) => void;
  remove: (id: string) => void;
  toggle: (item: WishlistItem) => void;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) =>
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) {
            return state;
          }
          return { items: [...state.items, item] };
        }),

      update: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),

      remove: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      toggle: (item) =>
        set((state) => {
          const exists = state.items.some(
            (i) => i.id === item.id
          );

          return exists
            ? {
                items: state.items.filter(
                  (i) => i.id !== item.id
                ),
              }
            : { items: [...state.items, item] };
        }),

      clear: () => set({ items: [] }),
    }),
    {
      name: "wishlist-store",
    }
  )
);
