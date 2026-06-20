import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import FaqAccordion from "../FaqAccordion";
import { cleanBlogHtml } from "../../libs/sanitizeHtml";
import type { BlogDoc } from "../../libs/blogConvert";

function formatDate(iso: string): string {
  const [y, m, d] = (iso || "").split("-").map((n) => parseInt(n, 10));
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  if (!y || !m || !d) return iso || "";
  return `${d} ${months[m - 1]} ${y}`;
}

/** Renders a database-authored blog post (sanitized rich HTML body). */
export default function BlogArticleDb({ post }: { post: BlogDoc }) {
  return (
    <article>
      <header className="relative" style={{ background: "linear-gradient(135deg, var(--hero-grad-1), var(--hero-grad-2))" }}>
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
              Pearl Bloom Journal{post.readMins ? ` • ${post.readMins} min read` : ""}
            </span>
            <h1 className="font-display italic text-4xl md:text-5xl leading-[1.1] mt-5" style={{ color: "var(--fg)", fontWeight: 400 }}>
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-5 text-base md:text-lg leading-relaxed" style={{ color: "var(--muted)" }}>{post.excerpt}</p>
            )}
            <p className="mt-5 text-sm" style={{ color: "var(--fg)" }}>
              By the <strong>Pearl Bloom Editorial Team</strong>
              <span style={{ color: "var(--muted)" }}> · Reviewed by our in-house jewellery team</span>
            </p>
            {post.datePublished && (
              <p className="mt-1.5 text-xs uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                Published {formatDate(post.datePublished)}
                {post.dateModified && post.dateModified !== post.datePublished
                  ? ` · Updated ${formatDate(post.dateModified)}`
                  : ""}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="container py-12 md:py-16">
        {post.heroImage?.url && (
          <div className="relative w-full max-w-3xl aspect-[16/9] rounded-2xl overflow-hidden mb-10" style={{ background: "var(--panel)" }}>
            <Image src={post.heroImage.url} alt={post.heroImage.alt || post.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
          </div>
        )}

        <div
          className="seo-prose blog-prose max-w-3xl text-base md:text-[1.05rem] leading-relaxed"
          style={{ color: "var(--muted)" }}
          dangerouslySetInnerHTML={{ __html: cleanBlogHtml(post.bodyHtml) }}
        />

        {(() => {
          // Use admin-set related links when present; otherwise fall back to a
          // curated set so every journal post still interlinks down to the shop.
          const links =
            post.related?.length > 0
              ? post.related
              : [
                  { href: "/earrings", label: "All Earrings" },
                  { href: "/earrings/finish/gold-plated", label: "Gold Plated Earrings" },
                  { href: "/earrings/style/stud", label: "Stud Earrings" },
                  { href: "/earrings/style/hoop", label: "Hoop Earrings" },
                  { href: "/earrings/style/jhumka", label: "Jhumka Earrings" },
                  { href: "/earrings/occasion/daily-wear", label: "Daily Wear Earrings" },
                ];
          return (
            <nav className="mt-12 max-w-3xl" aria-label="Shop related earrings">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--fg)" }}>Shop the collections</p>
              <ul className="flex flex-wrap gap-2.5">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-block rounded-full px-4 py-2 text-sm transition-all duration-150 hover:-translate-y-0.5" style={{ border: "1px solid var(--hero-card-border)", background: "var(--hero-card)", color: "rgb(var(--bronze-rgb))" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          );
        })()}

        {post.faqs?.length > 0 && (
          <div className="mt-14 max-w-3xl">
            <FaqAccordion items={post.faqs} />
          </div>
        )}
      </div>
    </article>
  );
}
