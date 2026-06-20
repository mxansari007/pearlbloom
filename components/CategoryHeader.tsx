import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CategoryHeader({
  breadcrumb,
  name,
  kicker,
  h1,
  description,
  returnHref = "/earrings",
}: {
  breadcrumb: string;
  name: string;
  kicker: string;
  h1: string;
  description: string;
  returnHref?: string;
}) {
  return (
    <section
      className="relative"
      style={{ background: "linear-gradient(135deg, var(--hero-grad-1), var(--hero-grad-2))" }}
    >
      <div className="container pt-6 pb-12 md:pt-7 md:pb-16">
        {/* Top row: breadcrumb + return */}
        <div className="flex items-center justify-between gap-4">
          <nav
            className="flex items-center gap-2 flex-wrap text-[11px] font-semibold uppercase tracking-[0.16em]"
            aria-label="Breadcrumb"
          >
            <Link href="/" style={{ color: "var(--muted)" }} className="hover:opacity-80 transition-opacity">
              Pearl Bloom
            </Link>
            <span style={{ color: "var(--muted)" }}>/</span>
            <span style={{ color: "rgb(var(--bronze-rgb))" }}>{breadcrumb}</span>
            <span style={{ color: "var(--muted)" }}>/</span>
            <span style={{ color: "var(--fg)" }}>{name}</span>
          </nav>

          <Link
            href={returnHref}
            className="shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5"
            style={{ border: "1px solid var(--hero-card-border)", background: "var(--hero-card)", color: "var(--fg)" }}
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Return to Home Directory</span>
            <span className="sm:hidden">Directory</span>
          </Link>
        </div>

        {/* Centered title block */}
        <div className="text-center max-w-3xl mx-auto mt-12 md:mt-16">
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "rgb(var(--wine-rgb))" }}
          >
            {kicker}
          </span>
          <h1
            className="font-display italic text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.08] mt-5"
            style={{ color: "var(--fg)", fontWeight: 400 }}
          >
            {h1}
          </h1>
          <p className="mt-5 text-base md:text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
