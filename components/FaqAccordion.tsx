import type { FaqItem } from "../content/shared";

/**
 * Renders an accessible FAQ accordion (native <details>/<summary>, no JS)
 * and emits valid FAQPage JSON-LD for the same questions.
 */
export default function FaqAccordion({
  items,
  heading = "Frequently asked questions",
  className = "",
}: {
  items: FaqItem[];
  heading?: string;
  className?: string;
}) {
  if (!items?.length) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className={className} aria-labelledby="faq-heading">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2
        id="faq-heading"
        className="font-display italic text-2xl md:text-3xl mb-6"
        style={{ color: "var(--fg)", fontWeight: 400 }}
      >
        {heading}
      </h2>
      <div className="space-y-3">
        {items.map((f, i) => (
          <details
            key={i}
            className="faq-item rounded-xl px-5 py-4"
          >
            <summary
              className="flex items-center justify-between gap-4 cursor-pointer list-none text-base font-semibold"
              style={{ color: "var(--fg)" }}
            >
              <span>{f.q}</span>
              <span className="faq-icon shrink-0 text-xl leading-none transition-transform" aria-hidden style={{ color: "rgb(var(--bronze-rgb))" }}>
                +
              </span>
            </summary>
            <p className="mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
