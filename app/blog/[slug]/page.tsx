export const revalidate = 120;

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import BlogArticleDb from "@/components/blog/BlogArticleDb";
import { getBlogPost, getAllBlogSlugs } from "@/libs/blog.server";

type Params = { slug: string };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlbloom.in";

export async function generateStaticParams() {
  return (await getAllBlogSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article — Pearl Bloom" };

  const url = `/blog/${slug}`;
  const title = post.metaTitle || `${post.title} | Pearl Bloom`;
  return {
    title,
    description: post.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: post.metaDescription,
      url,
      siteName: "Pearl Bloom",
      type: "article",
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified ?? post.datePublished,
      images: [{ url: post.heroImage?.url || "/earring.png", alt: post.heroImage?.alt || post.title }],
    },
    twitter: { card: "summary_large_image", title, description: post.metaDescription, images: [post.heroImage?.url || "/earring.png"] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const url = `${SITE}/blog/${slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Journal", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.metaDescription,
      image: post.heroImage?.url || `${SITE}/earring.png`,
      datePublished: post.datePublished,
      dateModified: post.dateModified ?? post.datePublished,
      author: { "@type": "Organization", name: "Pearl Bloom", url: SITE },
      publisher: {
        "@type": "Organization",
        name: "Pearl Bloom",
        url: SITE,
        logo: { "@type": "ImageObject", url: `${SITE}/logo.svg` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogArticleDb post={post} />
    </>
  );
}
