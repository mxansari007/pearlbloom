export type CollectionThumbnail = {
  public_id: string;
  url: string;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isFeatured?: boolean;
  priority?: number;
  thumbnail?: CollectionThumbnail;
};