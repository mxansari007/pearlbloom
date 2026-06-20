import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { BlogDoc } from "../../libs/blogConvert";

export default function BlogCardDb({ post }: { post: BlogDoc }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{ background: "var(--panel)", border: "1px solid var(--hero-card-border)" }}
    >
      {post.heroImage?.url && (
        <div className="relative w-full aspect-[16/10]" style={{ background: "var(--hero-tile)" }}>
          <Image src={post.heroImage.url} alt={post.heroImage.alt || post.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
        </div>
      )}
      <div className="flex flex-col flex-1 p-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgb(var(--bronze-rgb))" }}>
          {post.kind === "pillar" ? "Guide" : post.kind === "focused" ? "Style Tips" : "Journal"}
          {post.readMins ? ` • ${post.readMins} min` : ""}
        </span>
        <h2 className="font-display italic text-xl md:text-2xl mt-3 leading-snug" style={{ color: "var(--fg)", fontWeight: 400 }}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-3 text-sm leading-relaxed flex-1" style={{ color: "var(--muted)" }}>
            {post.excerpt}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium" style={{ color: "rgb(var(--bronze-rgb))" }}>
          Read article
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
