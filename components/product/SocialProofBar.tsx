import { Star, Flame } from "lucide-react";

function formatSold(n: number): string {
  if (n >= 10) return `${Math.floor(n / 10) * 10}+`;
  return String(n);
}

/**
 * Star rating + review count (links to #reviews) and a gated "X+ sold" line.
 * All values are real: rating/count come from real reviews, unitsSold is an
 * optional admin field. When there are no reviews yet, shows an honest USP
 * signal instead of any fabricated rating.
 */
export default function SocialProofBar({
  average,
  count,
  unitsSold,
}: {
  average: number;
  count: number;
  unitsSold?: number;
}) {
  const hasReviews = count > 0;
  const showSold = typeof unitsSold === "number" && unitsSold > 0;
  const filled = Math.round(average);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      {hasReviews ? (
        <a
          href="#reviews"
          className="group inline-flex items-center gap-2"
          aria-label={`${average.toFixed(1)} out of 5 from ${count} reviews. Jump to reviews.`}
        >
          <span className="flex items-center" aria-hidden>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                className={s <= filled ? "text-[rgb(var(--gold-rgb))]" : "text-[var(--muted)]"}
                fill={s <= filled ? "rgb(var(--gold-rgb))" : "none"}
                stroke={s <= filled ? "none" : "currentColor"}
              />
            ))}
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {average.toFixed(1)}
          </span>
          <span className="text-sm underline-offset-2 group-hover:underline" style={{ color: "var(--muted)" }}>
            ({count} {count === 1 ? "Review" : "Reviews"})
          </span>
        </a>
      ) : (
        <span className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
          <span className="flex items-center" aria-hidden>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={15} className="text-[var(--muted)] opacity-40" />
            ))}
          </span>
          Anti-tarnish · skin-safe · lightweight
        </span>
      )}

      {showSold && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ background: "rgba(var(--gold-rgb),0.12)", color: "rgb(var(--gold-rgb))" }}
        >
          <Flame size={13} />
          {formatSold(unitsSold!)} sold
        </span>
      )}
    </div>
  );
}
