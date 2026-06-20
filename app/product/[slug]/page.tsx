import { notFound, permanentRedirect } from "next/navigation";
import { getProductBySlug } from "../../../libs/products.server";
import { productPath } from "../../../libs/productUrl";

// Legacy product URLs (/product/<slug>) now 308-redirect to the canonical
// /earrings/<category>/<slug> path. This preserves old links, search rankings,
// and any saved wishlist/order links that only know the slug.
type ParamsLike = { slug?: string } | Promise<{ slug?: string }>;

export default async function LegacyProductRedirect({
  params,
}: {
  params: ParamsLike;
}) {
  const { slug } = (await params) as { slug?: string };
  if (!slug) notFound();

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  permanentRedirect(productPath(product));
}
