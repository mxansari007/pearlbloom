import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@/libs/collections.server";
import InfiniteProductGrid from "@/components/InfiniteProductGrid";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();

  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  return (
<section className="max-w-7xl mx-auto px-6 py-14">
  {/* Heading */}
  <div className="mb-10">
    <h1 className="text-xl md:text-xl font-display tracking-wide">
      {collection.name}
    </h1>
    <p className="mt-2 text-sm text-neutral-400 max-w-xl">
      Handcrafted pieces designed to elevate everyday elegance.
    </p>
  </div>

  {/* Grid */}
  <InfiniteProductGrid collectionSlug={collection.slug} />
</section>

  );
}
