import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "./useCartStore";

interface BuyNowState {
  item: CartItem | null;
  
  setBuyNowItem: (item: CartItem) => void;
  updateQty: (qty: number) => void;
  clearBuyNowItem: () => void;
  
  // Helper to get total
  getTotal: () => number;
}

export const useBuyNowStore = create<BuyNowState>()(
  persist(
    (set, get) => ({
      item: null,

      setBuyNowItem: (item) => set({ item: { ...item, quantity: item.quantity || 1 } }),

      updateQty: (qty) =>
        set((state) => ({
          item: state.item ? { ...state.item, quantity: qty } : null,
        })),

      clearBuyNowItem: () => set({ item: null }),

      getTotal: () => {
        const { item } = get();
        return item ? item.price * item.quantity : 0;
      },
    }),
    {
      name: "pearlbloom-buynow",
    }
  )
);
