import type { Product } from "../../types/products";

const NEW_WINDOW_DAYS = 30;

/** Single, real status: Bestseller (featured) takes priority over New (recent). */
export function getCardStatus(product: Product): "bestseller" | "new" | null {
  if (product.isFeatured) return "bestseller";
  const created = new Date(product.createdAt).getTime();
  if (Number.isFinite(created) && Date.now() - created < NEW_WINDOW_DAYS * 86_400_000) {
    return "new";
  }
  return null;
}

export default function StatusBadge({ product }: { product: Product }) {
  const status = getCardStatus(product);
  if (!status) return null;

  const isBest = status === "bestseller";
  return (
    <span
      className="absolute top-2 left-2 md:top-3 md:left-3 z-20 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
      style={{
        background: isBest ? "rgb(var(--wine-rgb))" : "rgba(17,17,17,0.82)",
        color: "#fff",
        backdropFilter: "blur(6px)",
      }}
    >
      {isBest ? "Bestseller" : "New In"}
    </span>
  );
}
