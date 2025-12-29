import { useProductStore } from '../store/useProductStore';

export function useProductVariant() {
  const product = useProductStore((state) => state.product);
  const selectedVariant = useProductStore((state) => state.selectedVariant);
  const setVariant = useProductStore((state) => state.setVariant);
  const initializeProduct = useProductStore((state) => state.initializeProduct);

  return {
    product,
    selectedVariant,
    setVariant,
    initializeProduct,
    // Helper to get variants list safely
    variants: product?.variants ?? [],
    // Helper to check if data is ready
    isReady: !!product && !!selectedVariant,
  };
}
