export const revalidate = 120;

import type { Metadata } from "next";

import CategoryHeader from "@/components/CategoryHeader";
import BlogCardDb from "@/components/blog/BlogCardDb";
import { getAllBlogPosts } from "@/libs/blog.server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlbloom.in";
const DESC =
  "Style guides, care tips and earring inspiration from Pearl Bloom — how to choose, wear and care for affordable, anti-tarnish fashion earrings.";

export const metadata: Metadata = {
  title: "Earrings Journal — Style Guides & Tips | Pearl Bloom",
  description: DESC,
  keywords: ["earrings blog", "earring style guide", "how to wear earrings", "earring care tips", "Pearl Bloom"],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Earrings Journal | Pearl Bloom",
    description: DESC,
    url: "/blog",
    siteName: "Pearl Bloom",
    type: "website",
    images: [{ url: "/earring.png", width: 665, height: 597, alt: "Pearl Bloom Journal" }],
  },
  twitter: { card: "summary_large_image", title: "Earrings Journal | Pearl Bloom", description: DESC, images: ["/earring.png"] },
};

export default async function BlogIndexPage() {
  const posts = await getAllBlogPosts();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Journal", item: `${SITE}/blog` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Pearl Bloom Journal",
      description: DESC,
      url: `${SITE}/blog`,
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.metaDescription,
        url: `${SITE}/blog/${p.slug}`,
        datePublished: p.datePublished,
        dateModified: p.dateModified ?? p.datePublished,
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CategoryHeader
        breadcrumb="Journal"
        name="All Articles"
        kicker="Pearl Bloom Journal • Guides & Style Tips"
        h1="The Pearl Bloom Journal"
        description="Style guides, care tips and earring inspiration to help you choose, wear and care for your Pearl Bloom pieces."
        returnHref="/"
      />

      <section className="container py-12 md:py-16">
        {posts.length === 0 ? (
          <p className="text-center" style={{ color: "var(--muted)" }}>No articles yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {posts.map((p) => (
              <BlogCardDb key={p.slug} post={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
