// External marketplace links
export type Marketplaces = {
  amazon?: string;
  flipkart?: string;
  meesho?: string;
};

// Flexible attribute key/value pair
export type ProductAttribute = {
  key: string;
  value: string;
};

// ✅ FINAL Product model — matches Admin form + Firestore + UI
export type Product = {
  id: string;

  // Identity
  name: string;
  slug: string;

  // Pricing
  price: number;
  currency: string; // "INR"

  // Descriptions
  shortDescription: string;
  description: string;

  // Media
  thumbnailUrl: string;
  images: string[];

  // Relations
  brand: string;
  categories: string[];
  collectionId: string;

  // Flags
  isFeatured: boolean;

  // Dynamic attributes
  attributes: ProductAttribute[];

  // Marketplaces
  marketplaces: Marketplaces;
};
