// types/products.ts

export type Attribute = {
  key: string;
  value: string;
};

export type Discount = {
  type: "PERCENT" | "FLAT";
  value: number;
};

export type Stock = {
  quantity: number;
  track: boolean;
  lowStockThreshold?: number;
};

export type Variant = {
  id: string;
  attributes: Attribute[];
  price: number;
  discount?: Discount;
  stock: Stock;
  sku?: string;
  images?: string[];
  isActive: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand?: string;

  price?: number;

  description?: string;
  shortDescription?: string;

  categories?: string[];
  attributes?: Attribute[];

  images?: string[];
  thumbnailUrl?: string;

  currency: "INR";

  inventoryPolicy: {
    trackStock: boolean;
    allowBackorder: boolean;
  };

  marketplaces?: {
    amazon?: string;
    flipkart?: string;
    meesho?: string;
  };

  variants: Variant[];

  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
};
