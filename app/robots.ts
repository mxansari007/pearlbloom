import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlboom.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/orders/", "/checkout/", "/profile/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
