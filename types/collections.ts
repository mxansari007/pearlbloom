/**
 * Collection types
 * Used across:
 * - Admin panel (create/edit collections)
 * - Public site (listing & navigation)
 * - Server components (SEO / SSR)
 * - Firestore mapping
 */

/* ---------------------------------- */
/* Thumbnail / Media */
/* ---------------------------------- */

export type CollectionThumbnail = {
  /** Public URL (Cloudinary / CDN) */
  url: string;

  /** Cloudinary public_id (for delete/update) */
  public_id?: string;

  /** Alt text for accessibility & SEO */
  alt?: string;
};

/* ---------------------------------- */
/* Main Collection Type */
/* ---------------------------------- */

export type Collection = {
  /** Firestore document ID */
  id: string;

  /** Display name shown to users */
  name: string;

  /** URL-safe unique slug */
  slug: string;

  /** Optional description (SEO + UI) */
  description?: string;

  /** Sort order (lower = higher priority) */
  priority?: number;

  /** Highlight on homepage / navigation */
  isFeatured?: boolean;

  /** Control visibility without deletion */
  isActive?: boolean;

  /** Optional thumbnail image */
  thumbnail?: CollectionThumbnail;

  /** Number of products (derived, optional) */
  productCount?: number;

  /** Firestore timestamps */
  createdAt?: unknown;
  updatedAt?: unknown;
};

/* ---------------------------------- */
/* Admin / Form Variants */
/* ---------------------------------- */

/**
 * Used for create/edit forms
 * (no `id`, timestamps handled by Firestore)
 */
export type CollectionForm = Omit<
  Collection,
  "id" | "createdAt" | "updatedAt" | "productCount"
>;

/**
 * Payload sent to Firestore
 * (explicit to avoid accidental writes)
 */
export type CollectionPayload = {
  name: string;
  slug: string;
  description?: string;
  priority?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  thumbnail?: CollectionThumbnail;
};

/* ---------------------------------- */
/* Utility Types */
/* ---------------------------------- */

/**
 * Lightweight type for navigation menus
 */
export type CollectionNavItem = Pick<
  Collection,
  "id" | "name" | "slug" | "isFeatured"
>;

/**
 * Minimal public-safe collection
 */
export type PublicCollection = Pick<
  Collection,
  "id" | "name" | "slug" | "thumbnail"
>;
