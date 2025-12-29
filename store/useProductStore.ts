import { create } from 'zustand';
import { Product, Variant } from '../types/products';

interface ProductState {
  product: Product | null;
  selectedVariant: Variant | null;
  
  // Actions
  initializeProduct: (product: Product) => void;
  setVariant: (variant: Variant) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  product: null,
  selectedVariant: null,

  initializeProduct: (product: Product) => {
    // Do not preselect any variant; keep selection null initially
    set({
      product,
      selectedVariant: null,
    });
  },

  setVariant: (variant: Variant) => {
    set({ selectedVariant: variant });
  },
}));
