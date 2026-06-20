import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "../../content/blog/types";

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
      style={{ background: "var(--panel)", border: "1px solid var(--hero-card-border)" }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgb(var(--bronze-rgb))" }}>
        {post.kind === "pillar" ? "Guide" : "Style Tips"} • {post.readMins} min
      </span>
      <h2
        className="font-display italic text-xl md:text-2xl mt-3 leading-snug"
        style={{ color: "var(--fg)", fontWeight: 400 }}
      >
        {post.h1}
      </h2>
      <p className="mt-3 text-sm leading-relaxed flex-1" style={{ color: "var(--muted)" }}>
        {post.excerpt}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium" style={{ color: "rgb(var(--bronze-rgb))" }}>
        Read article
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
