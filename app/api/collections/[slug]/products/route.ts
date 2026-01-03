import { NextResponse } from "next/server";
import { getCollectionBySlug } from "@/libs/collections.server";
import { getProductsByCollectionId } from "@/libs/products.server";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ slug: string }>;
  }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({
      products: [],
      nextCursor: null,
    });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  
  // Check if collectionId was passed directly (optimization for pagination)
  const collectionIdParam = searchParams.get("collectionId");

  let collectionId: string | null = collectionIdParam;

  // Only fetch collection if we don't have the ID
  if (!collectionId) {
    const collection = await getCollectionBySlug(slug);
    if (!collection) {
      return NextResponse.json({
        products: [],
        nextCursor: null,
      });
    }
    collectionId = collection.id;
  }

  const data = await getProductsByCollectionId(collectionId, cursor);

  // Include collectionId in response for future pagination calls
  return NextResponse.json({
    ...data,
    collectionId,
  });
}
