import Link from "next/link";
import RichText from "./RichText";
import FaqAccordion from "./FaqAccordion";
import CollectionTrust from "./CollectionTrust";
import type { CollectionSeo } from "../content/seo/earrings/types";

/**
 * Long-form SEO body rendered below the product grid on every earrings
 * collection page: intro copy (with inline internal links), a contextual
 * related-collections block, and the FAQ accordion (+ FAQPage JSON-LD).
 */
export default function CollectionSeoBody({
  seo,
  name,
  blogHref,
  blogLabel,
}: {
  seo: CollectionSeo;
  name: string;
  blogHref?: string;
  blogLabel?: string;
}) {
  return (
    <>
    <section className="container py-12 md:py-16" style={{ borderTop: "1px solid var(--hero-hairline)" }}>
      <div className="max-w-3xl">
        <h2
          className="font-display italic text-2xl md:text-3xl mb-5"
          style={{ color: "var(--fg)", fontWeight: 400 }}
        >
          About {name}
        </h2>
        <div className="seo-prose text-base leading-relaxed" style={{ color: "var(--muted)" }}>
          <RichText paras={seo.intro} />
        </div>

        {blogHref && blogLabel && (
          <p className="mt-6 text-base" style={{ color: "var(--muted)" }}>
            Want to go deeper?{" "}
            <Link href={blogHref} className="seo-link">
              {blogLabel}
            </Link>
            .
          </p>
        )}
      </div>

      {seo.internalLinks.length > 0 && (
        <nav className="mt-10" aria-label="Related collections">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--fg)" }}>
            Explore related earrings
          </p>
          <ul className="flex flex-wrap gap-2.5">
            {seo.internalLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-block rounded-full px-4 py-2 text-sm transition-all duration-150 hover:-translate-y-0.5"
                  style={{
                    border: "1px solid var(--hero-card-border)",
                    background: "var(--hero-card)",
                    color: "rgb(var(--bronze-rgb))",
                  }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-12 max-w-3xl">
        <FaqAccordion items={seo.faqs} />
      </div>
      </section>

      {/* E-E-A-T: expertise + trust signals, shown on every collection page. */}
      <CollectionTrust />
    </>
  );
}
