import { getAllProducts } from "@/libs/products.server";
import WishlistClient from "./WishlistClient";

export const metadata = {
  title: "Wishlist — Pearl Bloom",
};

export default async function WishlistPage() {
  const allProducts = await getAllProducts();
  
  return <WishlistClient allProducts={allProducts} />;
}
