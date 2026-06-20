export const revalidate = 120;

import type { Metadata } from "next";

import CategoryHeader from "../../../components/CategoryHeader";
import EarringFilterBrowser from "../../../components/EarringFilterBrowser";
import { getAllProducts, getFeaturedProducts } from "../../../libs/products.server";
import type { Product } from "../../../types/products";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlbloom.in";
const H1 = "Most-Loved Best Sellers";
const DESC =
  "The pieces our customers reach for again and again — the most-loved, most-reviewed earrings in the collection. Tried, tested and adored, these are the styles that keep selling out.";

export const metadata: Metadata = {
  title: "Best Sellers — Earrings | Pearl Bloom",
  description: `Best Sellers — ${DESC}`,
  keywords: ["best selling earrings", "popular earrings", "top rated earrings", "Pearl Bloom"],
  alternates: { canonical: "/earrings/best-sellers" },
  openGraph: {
    title: "Best Sellers | Pearl Bloom",
    description: DESC,
    url: "/earrings/best-sellers",
    siteName: "Pearl Bloom",
    type: "website",
    images: [{ url: "/earring.png", width: 665, height: 597, alt: "Best Sellers" }],
  },
  twitter: { card: "summary_large_image", title: "Best Sellers | Pearl Bloom", description: DESC, images: ["/earring.png"] },
};

export default async function BestSellersPage() {
  let products: Product[] = await getFeaturedProducts(48);
  if (!products.length) {
    products = await getAllProducts();
  }

  const url = `${SITE}/earrings/best-sellers`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "All Earrings", item: `${SITE}/earrings` },
        { "@type": "ListItem", position: 3, name: "Best Sellers", item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Best Sellers",
      description: DESC,
      url,
      isPartOf: { "@type": "WebSite", name: "Pearl Bloom", url: SITE },
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CategoryHeader
        breadcrumb="Curated Edit"
        name="Best Sellers"
        kicker="Most Loved • Customer Favourites"
        h1={H1}
        description={DESC}
        returnHref="/earrings"
      />

      <section className="container py-12 md:py-16">
        <EarringFilterBrowser products={products} />
      </section>
    </>
  );
}
