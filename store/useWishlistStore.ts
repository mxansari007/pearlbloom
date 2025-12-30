import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { track } from "@/utils/analytics";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
};

type WishlistState = {
  items: WishlistItem[];
  hasHydrated: boolean;

  add: (item: WishlistItem) => void;
  update: (id: string, updates: Partial<WishlistItem>) => void;
  remove: (id: string) => void;
  toggle: (item: WishlistItem) => void;
  clear: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      add: (item) =>
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) {
            return state;
          }
          track("wishlist_item_added", {
            product_id: item.id,
            slug: item.slug,
            price: item.price,
            wishlist_count: state.items.length + 1,
          });
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
          items: (() => {
            const removed = state.items.find((i) => i.id === id);
            const next = state.items.filter((i) => i.id !== id);
            track("wishlist_item_removed", {
              product_id: removed?.id,
              slug: removed?.slug,
              price: removed?.price,
              wishlist_count: next.length,
            });
            return next;
          })(),
        })),

      toggle: (item) =>
        set((state) => {
          const exists = state.items.some(
            (i) => i.id === item.id
          );

          track(exists ? "wishlist_item_removed" : "wishlist_item_added", {
            product_id: item.id,
            slug: item.slug,
            price: item.price,
            wishlist_count: exists ? state.items.length - 1 : state.items.length + 1,
          });

          return exists
            ? {
                items: state.items.filter(
                  (i) => i.id !== item.id
                ),
              }
            : { items: [...state.items, item] };
        }),

      clear: () => {
        const prevCount = get().items.length;
        set({ items: [] });
        track("wishlist_cleared", { wishlist_count: prevCount });
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "wishlist-store",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : localStorage
      ),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
