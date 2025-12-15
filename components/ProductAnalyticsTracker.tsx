// src/components/ProductAnalyticsTracker.tsx
"use client";

import { useEffect } from "react";
import type { Product } from "../types/products";
import { getPosthog } from "../libs/posthog-client";

type Props = {
  product: Product;
};

export default function ProductAnalyticsTracker({ product }: Props) {
  useEffect(() => {
    const ph = getPosthog();
    if (!ph) return;

    ph.capture("view_product", {
      product_id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      categories: product.categories,
      brand: product.brand,
    });
  }, [product.id, product.slug, product.title, product.price]);

  return null;
}
