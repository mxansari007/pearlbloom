import { Star } from "lucide-react";

/** Compact star rating for cards. Renders nothing unless real reviews exist. */
export default function CardRating({
  avg,
  count,
  className = "",
}: {
  avg?: number;
  count?: number;
  className?: string;
}) {
  if (!count || count <= 0 || !avg) return null;
  const filled = Math.round(avg);
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label={`Rated ${avg.toFixed(1)} out of 5 from ${count} reviews`}
    >
      <span className="flex items-center" aria-hidden>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={12}
            className={s <= filled ? "text-[rgb(var(--gold-rgb))]" : "text-[var(--muted)]"}
            fill={s <= filled ? "rgb(var(--gold-rgb))" : "none"}
            stroke={s <= filled ? "none" : "currentColor"}
          />
        ))}
      </span>
      <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>
        {avg.toFixed(1)}
      </span>
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        ({count})
      </span>
    </span>
  );
}
