import { redirect, permanentRedirect } from "next/navigation";
import { getProductBySlug } from "../../../libs/products.server";
import { productPath } from "../../../libs/productUrl";

// Legacy product URLs (/product/<slug>) 308-redirect to the canonical
// /earrings/<category>/<slug> path. This preserves old links, search rankings,
// and any saved wishlist/order links that only know the slug.
//
// If the product no longer exists (removed or re-slugged — e.g. an item in an
// old order), we send the visitor to the catalog instead of a hard 404 so
// clicking an order item never shows an error page.
type ParamsLike = { slug?: string } | Promise<{ slug?: string }>;

export default async function LegacyProductRedirect({
  params,
}: {
  params: ParamsLike;
}) {
  const { slug } = (await params) as { slug?: string };
  if (!slug) redirect("/earrings");

  const product = await getProductBySlug(slug);
  if (!product) redirect("/earrings");

  permanentRedirect(productPath(product));
}
