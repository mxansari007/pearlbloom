import { BadgePercent } from "lucide-react";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/**
 * Price anchoring block: prominent selling price, struck-through MRP, discount
 * badge + savings, and "Inclusive of all taxes". Falls back to value framing
 * when there is no real discount (never invents an MRP).
 */
export default function PriceBlock({
  finalPrice,
  originalPrice,
  hasDiscount,
  discountPercent,
}: {
  finalPrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  discountPercent?: number;
}) {
  const saved = hasDiscount ? Math.max(0, originalPrice - finalPrice) : 0;

  return (
    <div className="product-detail__price-block">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-3xl md:text-[2rem] font-bold leading-none" style={{ color: "var(--fg)" }}>
          {inr(finalPrice)}
        </span>

        {hasDiscount && (
          <>
            <span className="text-lg line-through" style={{ color: "var(--muted)" }}>
              MRP {inr(originalPrice)}
            </span>
            {typeof discountPercent === "number" && discountPercent > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold"
                style={{ background: "rgba(var(--gold-rgb),0.14)", color: "rgb(var(--gold-rgb))" }}
              >
                <BadgePercent size={13} />
                {discountPercent}% OFF
              </span>
            )}
          </>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {hasDiscount && saved > 0 && (
          <span className="font-semibold" style={{ color: "rgb(var(--success-rgb, 34 197 94))" }}>
            You save {inr(saved)}
          </span>
        )}
        <span style={{ color: "var(--muted)" }}>
          Inclusive of all taxes{hasDiscount ? "" : " · Honest everyday value"}
        </span>
      </div>
    </div>
  );
}
