// src/types/products.ts

// Marketplace outbound links
export type Marketplaces = {
  amazon?: string;
  flipkart?: string;
  meesho?: string;
};

// Flexible attribute key/value pair
export type ProductAttribute = {
  key: string;     // e.g., "Metal"
  value: string;   // e.g., "18K White Gold"
};

// 🔥 Final Product model — matches Admin + Storefront
export type Product = {
  id: string;
  title: string;
  slug: string;

  // Pricing
  price?: number;
  currency?: string; // default "INR"

  // Description
  description?: string;
  shortDescription?: string;

  // Media
  thumbnailUrl?: string;
  images: string[];

  // SEO / relations
  brand?: string;
  categories?: string[];
  collectionId?: string;

  // Featured flag
  isFeatured?: boolean;

  // Dynamic attributes (metal, gemstone, sku, purity, etc.)
  attributes?: ProductAttribute[];

  // Old fields kept for backward compatibility (will be migrated to attributes)
  metal?: string;
  gemstone?: string;
  sku?: string;

  // Marketplace outbound purchasing
  marketplaces?: Marketplaces;
};
