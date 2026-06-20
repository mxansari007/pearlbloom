import { MetadataRoute } from "next";
import { getAllProducts } from "@/libs/products.server";
import { getAllCollections } from "@/libs/collections.server";
import { ALL_CATEGORIES } from "@/libs/earringCategories";
import { getAllBlogSlugs } from "@/libs/blog.server";
import { productPath } from "@/libs/productUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlbloom.in";
  const now = new Date();

  // 1. Core indexable hubs (no cart / login / profile / wishlist — those are
  //    private/transactional and must NOT be in the sitemap).
  const core: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/earrings`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/earrings/new-arrivals`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/earrings/best-sellers`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  // 2. Policy / trust pages (indexable, low priority).
  const policy: MetadataRoute.Sitemap = [
    "/shipping-and-delivery",
    "/returns-and-refunds",
    "/warranty-and-care",
    "/privacy-policy",
    "/terms-of-service",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  // 3. Earrings facet collections (13 style + 13 finish + 9 occasion).
  const facetRoutes = ALL_CATEGORIES.map((c) => ({
    url: `${baseUrl}/earrings/${c.type}/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 4. Blog posts.
  const blogRoutes = (await getAllBlogSlugs()).map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // 5. Collections.
  const collections = await getAllCollections();
  const collectionRoutes = collections.map((collection) => ({
    url: `${baseUrl}/collections/${collection.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // 6. Product detail pages (canonical /earrings/<category>/<slug> URLs).
  const products = await getAllProducts();
  const productRoutes = products.map((p) => ({
    url: `${baseUrl}${productPath(p)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...core, ...facetRoutes, ...blogRoutes, ...policy, ...collectionRoutes, ...productRoutes];
}
