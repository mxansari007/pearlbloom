export const revalidate = 60;

import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";

import CategoryHeader from "@/components/CategoryHeader";
import EarringFilterBrowser from "@/components/EarringFilterBrowser";
import CollectionSeoBody from "@/components/CollectionSeoBody";
import ProductDetail from "@/components/ProductDetail";
import {
  getAllProducts,
  attachRatings,
  getProductBySlug,
} from "@/libs/products.server";
import {
  getCategory,
  TYPE_META,
  allCategoryParams,
} from "@/libs/earringCategories";
import { getMergedCollectionSeo } from "@/libs/collectionSeo.server";
import { getBlogLink } from "@/content/blog";
import { productPath, productCategorySlug } from "@/libs/productUrl";

type Params = { type: string; slug: string };

// The first segment is a facet *type* only for these values; anything else is
// treated as a product category slug (e.g. /earrings/stud/<product-slug>).
const FACET_TYPES = new Set(["style", "finish", "occasion"]);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://pearlbloom.in";

export async function generateStaticParams() {
  const facetParams = allCategoryParams();
  const products = await getAllProducts();
  const productParams = products.map((p) => ({
    type: productCategorySlug(p),
    slug: p.slug,
  }));
  return [...facetParams, ...productParams];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { type, slug } = await params;

  /* ---- Facet collection page ---- */
  if (FACET_TYPES.has(type)) {
    const cat = getCategory(type, slug);
    if (!cat) return { title: "Earrings — Pearl Bloom" };

    const seo = await getMergedCollectionSeo(type, slug);
    const url = `/earrings/${type}/${slug}`;
    const title = seo?.metaTitle ?? `${cat.label} | Pearl Bloom`;
    const description = seo?.metaDescription ?? `${cat.label} — ${cat.description}`;
    const keywords = seo
      ? [seo.primaryKeyword, ...seo.secondaryKeywords, "anti-tarnish earrings", "Pearl Bloom"]
      : [cat.label, `${cat.name} earrings`, "earrings", "anti-tarnish earrings", "Pearl Bloom"];

    return {
      title,
      description,
      keywords,
      alternates: { canonical: url },
      robots: seo?.noindex ? { index: false, follow: true } : undefined,
      openGraph: {
        title,
        description,
        url,
        siteName: "Pearl Bloom",
        type: "website",
        images: [{ url: "/earring.png", width: 665, height: 597, alt: seo?.heroAlt ?? cat.label }],
      },
      twitter: { card: "summary_large_image", title, description, images: ["/earring.png"] },
    };
  }

  /* ---- Product detail page ---- */
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — Pearl Bloom" };

  const images = product.images?.length ? product.images : ["/images/placeholder.svg"];
  const description =
    product.metaDescription ||
    product.shortDescription ||
    product.description ||
    `Buy ${product.name} at Pearl Bloom — anti-tarnish, skin-safe, lightweight gold-tone fashion earrings. Easy returns and secure payments.`;
  const url = productPath(product);

  return {
    title: product.metaTitle || `${product.name} — Pearl Bloom`,
    description: description.slice(0, 320),
    alternates: { canonical: url },
    robots: product.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: product.name,
      description,
      url,
      siteName: "Pearl Bloom",
      type: "website",
      images,
    },
    twitter: { card: "summary_large_image", title: product.name, description, images },
  };
}

export default async function EarringsTypeSlugPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { type, slug } = await params;

  /* ---- Product detail page ---- */
  if (!FACET_TYPES.has(type)) {
    const product = await getProductBySlug(slug);
    if (!product) notFound();

    // Canonicalise: if the category segment doesn't match the product's
    // primary category, 308-redirect to the correct URL (no duplicate content).
    const canonical = productPath(product);
    if (canonical !== `/earrings/${type}/${slug}`) {
      permanentRedirect(canonical);
    }
    return <ProductDetail product={product} />;
  }

  /* ---- Facet collection page ---- */
  const cat = getCategory(type, slug);
  if (!cat) notFound();

  const meta = TYPE_META[cat.type];
  const seo = await getMergedCollectionSeo(type, slug);
  const all = await attachRatings(await getAllProducts());
  const blog = seo ? getBlogLink(seo.assignedBlog) : null;

  const url = `${SITE}/earrings/${type}/${slug}`;

  // Products explicitly tagged with this category — used for ItemList rich results.
  const tagged = all.filter((p) => (p[cat.type] ?? []).includes(cat.slug)).slice(0, 30);

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "All Earrings", item: `${SITE}/earrings` },
        { "@type": "ListItem", position: 3, name: cat.label, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: cat.label,
      description: seo?.metaDescription ?? cat.description,
      url,
      isPartOf: { "@type": "WebSite", name: "Pearl Bloom", url: SITE },
    },
  ];

  // Only emit ItemList when products are actually tagged for this category.
  if (tagged.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: cat.label,
      numberOfItems: tagged.length,
      itemListElement: tagged.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}${productPath(p)}`,
        name: p.name,
      })),
    });
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CategoryHeader
        breadcrumb={meta.breadcrumb}
        name={cat.name}
        kicker={cat.h1}
        h1={seo?.h1 ?? cat.label}
        description={seo?.lede ?? cat.description}
      />

      <section className="container py-12 md:py-16">
        <EarringFilterBrowser products={all} lockedType={cat.type} lockedSlug={cat.slug} />
      </section>

      {seo && (
        <CollectionSeoBody
          seo={seo}
          name={cat.label}
          blogHref={blog?.href}
          blogLabel={blog ? `Read our ${blog.title}` : undefined}
        />
      )}
    </>
  );
}
