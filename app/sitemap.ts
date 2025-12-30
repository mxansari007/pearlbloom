import { MetadataRoute } from "next";
import { getAllSlugs } from "@/libs/products.server";
import { getAllCollections } from "@/libs/collections.server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlboom.com";

  // 1. Static Routes
  const staticRoutes = [
    "",
    "/products",
    "/contact",
    "/login",
    "/cart",
    "/profile",
    "/wishlist",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // 2. Dynamic Product Routes
  const productSlugs = await getAllSlugs();
  const productRoutes = productSlugs.map((slug) => ({
    url: `${baseUrl}/product/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // 3. Dynamic Collection Routes
  const collections = await getAllCollections();
  const collectionRoutes = collections.map((collection) => ({
    url: `${baseUrl}/collections/${collection.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
