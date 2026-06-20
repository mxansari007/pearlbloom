import { Star, CheckCircle2 } from "lucide-react";
import { getGlobalReviewSummary, getRecentReviews } from "@/libs/products.server";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Verified Buyer";
  return `Verified Buyer · ${d.toLocaleString("en-IN", { month: "short", year: "numeric" })}`;
}

function Stars({ value = 5, size = 13 }: { value?: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < filled ? "fill-current" : ""}
          style={{ color: i < filled ? "rgb(var(--gold-rgb))" : "var(--muted)" }}
        />
      ))}
    </span>
  );
}

/**
 * Homepage social proof — REAL reviews only. Renders nothing until at least one
 * real review exists, then shows the genuine average, count and recent reviews.
 */
export default async function ReviewsSection() {
  const summary = await getGlobalReviewSummary();
  if (summary.count === 0) return null; // no real reviews yet → hide entirely

  const reviews = await getRecentReviews(6);

  return (
    <section className="relative" style={{ background: "var(--bg)" }}>
      <div className="container py-16 md:py-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "rgb(var(--bronze-rgb))" }}
          >
            Real Client Satisfaction
          </span>
          <h2
            className="font-display italic text-3xl md:text-5xl leading-[1.1] mt-4"
            style={{ color: "var(--fg)", fontWeight: 400 }}
          >
            Vetted Honestly By Real Customers
          </h2>
          <div className="mt-5 flex items-center justify-center gap-2.5">
            <span className="text-2xl font-bold" style={{ color: "var(--fg)" }}>
              {summary.average.toFixed(1)}
            </span>
            <Stars value={summary.average} size={16} />
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              ({summary.count} verified {summary.count === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>

        {/* Real review cards */}
        {reviews.length > 0 && (
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl p-6"
                style={{ background: "var(--hero-tile)", border: "1px solid var(--hero-card-border)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-semibold flex items-center gap-1.5" style={{ color: "var(--fg)" }}>
                      {r.userName}
                      {r.verified && <CheckCircle2 size={14} style={{ color: "rgb(var(--gold-rgb))" }} />}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide mt-0.5" style={{ color: "var(--muted)" }}>
                      {fmtDate(r.createdAt)}
                    </p>
                  </div>
                  <Stars value={r.rating} />
                </div>
                <p className="text-sm leading-relaxed italic" style={{ color: "var(--muted)" }}>
                  &ldquo;{r.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
