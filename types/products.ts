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

/** A small feature badge shown in the buy-box (the 2×2 grid).
 *  Admin-configurable; `icon` is a key from components/product/featureIcons. */
export type FeatureBadge = {
  icon?: string;
  title: string;
  subtitle?: string;
  /** Render with the gold highlight treatment. */
  highlight?: boolean;
};

/** An assurance card shown under the gallery (the pair). Admin-configurable. */
export type AssuranceCard = {
  icon?: string;
  eyebrow: string;
  title: string;
};

/** Same-day dispatch countdown configuration. Admin-configurable. */
export type DispatchTimer = {
  enabled: boolean;
  /** Cut-off hour in IST (0–23). Orders before this dispatch the same day. */
  cutoffHour: number;
  /** Cut-off minute in IST (0–59). */
  cutoffMinute?: number;
  /** Trailing label, e.g. "for same-day dispatch". */
  label?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand?: string;

  price?: number;
  shippingRate?: number;

  description?: string;
  shortDescription?: string;

  categories?: string[];
  // Taxonomy facet tags set in the admin (slugs from earringCategories.ts)
  style?: string[];
  finish?: string[];
  occasion?: string[];
  attributes?: Attribute[];

  images?: string[];
  thumbnailUrl?: string;
  /** url -> alt text for each product image (admin-set; SEO + accessibility). */
  imageAlt?: Record<string, string>;

  /** YouTube video URL for the product video (admin-set, optional). */
  youtubeVideoUrl?: string;
  /** Admin-uploaded thumbnail image for the YouTube video. */
  videoThumbnailImage?: string;
  /** Alt text for the video thumbnail image. */
  videoThumbnailAltText?: string;

  /** Admin SEO overrides for the product detail page. */
  metaTitle?: string;
  metaDescription?: string;
  noindex?: boolean;

  currency: "INR";

  inventoryPolicy: {
    trackStock: boolean;
    allowBackorder: boolean;
  };

  inventory?: {
    discountPercent?: number;
  };

  marketplaces?: {
    amazon?: string;
    flipkart?: string;
    meesho?: string;
  };

  /** Admin-configurable PDP trust content. Falls back to honest defaults
   *  (see components/product/featureIcons) when unset, so existing products
   *  keep the original design until edited. */
  featureBadges?: FeatureBadge[];
  assuranceCards?: AssuranceCard[];
  dispatchTimer?: DispatchTimer;

  variants: Variant[];

  isFeatured?: boolean;
  /** Optional admin-set social-proof signal. Surfaced on the PDP ONLY when set
   *  (e.g. "120+ sold"). Never fabricated — leave undefined to hide. */
  unitsSold?: number;
  /** Read-side enrichment from real reviews (see attachRatings). Display gated
   *  on ratingCount > 0; never fabricated. */
  ratingAvg?: number;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
};
