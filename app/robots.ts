import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlbloom.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / transactional / user-only paths — keep crawlers out.
        disallow: [
          "/api/",
          "/checkout",
          "/orders",
          "/order-success",
          "/profile",
          "/addresses",
          "/cart",
          "/wishlist",
          "/login",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
