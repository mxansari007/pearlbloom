import { notFound } from "next/navigation";
import { Suspense } from "react";
import InfiniteProductGrid from "@/components/InfiniteProductGrid";
import { getCollectionBySlug } from "@/libs/collections.server";
import { getProductsByCollectionId } from "@/libs/products.server";

// Enable ISR with 60 second revalidation
export const revalidate = 60;

/* ---------------- Types ---------------- */

type ParamsLike = { slug?: string } | Promise<{ slug?: string }>;

/* ---------------- Metadata (runs separately) ---------------- */

export async function generateMetadata({ params }: { params: ParamsLike }) {
  const { slug } = (await params) as { slug?: string };
  if (!slug) return { title: "Collection — Pearl Bloom" };

  // React cache() ensures this is deduplicated with page fetch
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Collection not found — Pearl Bloom" };

  return {
    title: `${collection.name} — Pearl Bloom`,
    description: collection.description || "Explore our curated collection",
  };
}

/* ---------------- Skeleton Components ---------------- */

function HeaderSkeleton() {
  return (
    <div className="collection-page__header">
      <div className="h-8 w-48 rounded-lg bg-[var(--card-bg-soft)] animate-pulse" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-[var(--card-bg-soft)] animate-pulse" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="collection-page__grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="collection-skeleton-card"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}

/* ---------------- Async Streaming Components ---------------- */

async function CollectionContent({ slug }: { slug: string }) {
  // Single fetch for collection - React cache() deduplicates with metadata
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  // Fetch products using collection.id (direct ID lookup is more efficient)
  const data = await getProductsByCollectionId(collection.id);

  return (
    <>
      {/* Header */}
      <div className="collection-page__header">
        <h1 className="collection-page__title">{collection.name}</h1>
        <p className="collection-page__description">
          {collection.description ||
            "Handcrafted pieces designed to elevate everyday elegance."}
        </p>
      </div>

      {/* Products */}
      {!data.products.length ? (
        <div className="collection-page__empty">
          <svg
            className="w-16 h-16 text-muted opacity-40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p>No products in this collection yet.</p>
        </div>
      ) : (
        <InfiniteProductGrid
          initialProducts={data.products}
          initialCursor={data.nextCursor}
          collectionSlug={slug}
          collectionId={collection.id}
        />
      )}
    </>
  );
}

/* ---------------- Page Component ---------------- */

export default async function CollectionPage({
  params,
}: {
  params: ParamsLike;
}) {
  const { slug } = (await params) as { slug?: string };

  if (!slug) {
    notFound();
  }

  return (
    <section className="collection-page">
      {/* Combined streaming - single Suspense for better UX */}
      <Suspense
        fallback={
          <>
            <HeaderSkeleton />
            <GridSkeleton />
          </>
        }
      >
        <CollectionContent slug={slug} />
      </Suspense>
    </section>
  );
}
