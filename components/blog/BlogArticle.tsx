import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RichText from "../RichText";
import FaqAccordion from "../FaqAccordion";
import type { BlogPost } from "../../content/blog/types";

function formatDate(iso: string): string {
  // Render a stable, locale-independent date (avoids hydration/runtime Date issues).
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}

export default function BlogArticle({ post }: { post: BlogPost }) {
  return (
    <article>
      {/* Header */}
      <header
        className="relative"
        style={{ background: "linear-gradient(135deg, var(--hero-grad-1), var(--hero-grad-2))" }}
      >
        <div className="container pt-6 pb-12 md:pt-7 md:pb-16">
          <div className="flex items-center justify-between gap-4">
            <nav className="flex items-center gap-2 flex-wrap text-[11px] font-semibold uppercase tracking-[0.16em]" aria-label="Breadcrumb">
              <Link href="/" style={{ color: "var(--muted)" }} className="hover:opacity-80 transition-opacity">Pearl Bloom</Link>
              <span style={{ color: "var(--muted)" }}>/</span>
              <Link href="/blog" style={{ color: "rgb(var(--bronze-rgb))" }} className="hover:opacity-80 transition-opacity">Journal</Link>
            </nav>
            <Link
              href="/blog"
              className="shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-y-0.5"
              style={{ border: "1px solid var(--hero-card-border)", background: "var(--hero-card)", color: "var(--fg)" }}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">All Articles</span>
              <span className="sm:hidden">Journal</span>
            </Link>
          </div>

          <div className="max-w-3xl mt-10 md:mt-14">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "rgb(var(--wine-rgb))" }}>
              Pearl Bloom Journal • {post.readMins} min read
            </span>
            <h1 className="font-display italic text-4xl md:text-5xl leading-[1.1] mt-5" style={{ color: "var(--fg)", fontWeight: 400 }}>
              {post.h1}
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed" style={{ color: "var(--muted)" }}>{post.excerpt}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
              Published {formatDate(post.datePublished)}
            </p>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="container py-12 md:py-16">
        <div className="seo-prose blog-prose max-w-3xl text-base md:text-[1.05rem] leading-relaxed" style={{ color: "var(--muted)" }}>
          <RichText paras={post.intro} />

          {post.sections.map((s, i) => (
            <section key={i} className="mt-10">
              <h2 className="font-display italic text-2xl md:text-3xl mb-4" style={{ color: "var(--fg)", fontWeight: 400 }}>
                {s.h2}
              </h2>
              <RichText paras={s.body} />
              {s.subsections?.map((sub, j) => (
                <div key={j} className="mt-6">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--fg)" }}>{sub.h3}</h3>
                  <RichText paras={sub.body} />
                </div>
              ))}
            </section>
          ))}
        </div>

        {post.related.length > 0 && (
          <nav className="mt-12 max-w-3xl" aria-label="Shop related earrings">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--fg)" }}>
              Shop the collections
            </p>
            <ul className="flex flex-wrap gap-2.5">
              {post.related.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block rounded-full px-4 py-2 text-sm transition-all duration-150 hover:-translate-y-0.5"
                    style={{ border: "1px solid var(--hero-card-border)", background: "var(--hero-card)", color: "rgb(var(--bronze-rgb))" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mt-14 max-w-3xl">
          <FaqAccordion items={post.faqs} />
        </div>
      </div>
    </article>
  );
}
