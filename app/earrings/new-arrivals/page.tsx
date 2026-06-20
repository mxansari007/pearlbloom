export const revalidate = 120;

import type { Metadata } from "next";

import CategoryHeader from "../../../components/CategoryHeader";
import EarringFilterBrowser from "../../../components/EarringFilterBrowser";
import { getAllProducts } from "../../../libs/products.server";
import type { Product } from "../../../types/products";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlbloom.in";
const H1 = "Freshly Crafted Arrivals";
const DESC =
  "The latest additions to the Pearl Bloom catalog — newly crafted gold-plated, anti-tarnish earrings fresh off the studio bench. Be the first to wear the newest silhouettes.";

export const metadata: Metadata = {
  title: "New Arrivals — Earrings | Pearl Bloom",
  description: `New Arrivals — ${DESC}`,
  keywords: ["new arrivals earrings", "latest earrings", "new earrings", "Pearl Bloom"],
  alternates: { canonical: "/earrings/new-arrivals" },
  openGraph: {
    title: "New Arrivals | Pearl Bloom",
    description: DESC,
    url: "/earrings/new-arrivals",
    siteName: "Pearl Bloom",
    type: "website",
    images: [{ url: "/earring.png", width: 665, height: 597, alt: "New Arrivals" }],
  },
  twitter: { card: "summary_large_image", title: "New Arrivals | Pearl Bloom", description: DESC, images: ["/earring.png"] },
};

export default async function NewArrivalsPage() {
  const all: Product[] = await getAllProducts();
  const products = [...all].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const url = `${SITE}/earrings/new-arrivals`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "All Earrings", item: `${SITE}/earrings` },
        { "@type": "ListItem", position: 3, name: "New Arrivals", item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "New Arrivals",
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
        name="New Arrivals"
        kicker="Just In • Hot Off The Bench"
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
