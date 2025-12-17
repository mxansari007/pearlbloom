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
  // ✅ unwrap params FIRST
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({
      products: [],
      nextCursor: null,
    });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;

  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return NextResponse.json({
      products: [],
      nextCursor: null,
    });
  }

  const data = await getProductsByCollectionId(
    collection.id,
    cursor
  );

  return NextResponse.json(data);
}
