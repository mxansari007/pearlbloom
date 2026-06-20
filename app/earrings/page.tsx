export const revalidate = 60;

import type { Metadata } from "next";

import CategoryHeader from "@/components/CategoryHeader";
import EarringFilterBrowser from "@/components/EarringFilterBrowser";
import CollectionSeoBody from "@/components/CollectionSeoBody";
import { getAllProducts, attachRatings } from "@/libs/products.server";
import { ALL_EARRINGS } from "@/libs/earringCategories";
import { getMergedAllEarringsSeo } from "@/libs/collectionSeo.server";
import { getBlogLink } from "@/content/blog";
import type { Product } from "@/types/products";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlbloom.in";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getMergedAllEarringsSeo();
  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: [seo.primaryKeyword, ...seo.secondaryKeywords, "earrings", "Pearl Bloom"],
    alternates: { canonical: "/earrings" },
    robots: seo.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      url: "/earrings",
      siteName: "Pearl Bloom",
      type: "website",
      images: [{ url: "/earring.png", width: 665, height: 597, alt: seo.heroAlt }],
    },
    twitter: { card: "summary_large_image", title: seo.metaTitle, description: seo.metaDescription, images: ["/earring.png"] },
  };
}

export default async function AllEarringsPage() {
  const seo = await getMergedAllEarringsSeo();
  const all: Product[] = await attachRatings(await getAllProducts());
  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const blog = getBlogLink(seo.assignedBlog);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "All Earrings", item: `${SITE}/earrings` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "All Earrings",
      description: seo.metaDescription,
      url: `${SITE}/earrings`,
      isPartOf: { "@type": "WebSite", name: "Pearl Bloom", url: SITE },
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CategoryHeader
        breadcrumb={ALL_EARRINGS.breadcrumb}
        name="All Earrings"
        kicker={ALL_EARRINGS.h1}
        h1={seo.h1}
        description={seo.lede}
        returnHref="/"
      />

      <main className="container py-10 md:py-14">
        <EarringFilterBrowser products={all} />
      </main>

      <CollectionSeoBody
        seo={seo}
        name="Pearl Bloom Earrings"
        blogHref={blog?.href}
        blogLabel={blog ? `Read our ${blog.title}` : undefined}
      />
    </>
  );
}
