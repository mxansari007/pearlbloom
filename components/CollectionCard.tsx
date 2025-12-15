"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";


/* ---------------- Types ---------------- */

type CloudinaryImage = {
  url: string;
  public_id: string;
};

type CollectionCardProps = {
  title: string;
  slug: string;
  thumbnail?: CloudinaryImage; // ✅ updated
};

export default function CollectionCard({
  title,
  slug,
  thumbnail,
}: CollectionCardProps) {
  const [hover, setHover] = useState(false);


  return (
    <Link
      href={`/collections/${slug}`}
      className={`
        group block relative overflow-hidden rounded-xl cursor-pointer 
        border border-white/5 transition-all duration-500 will-change-transform
        hover:-translate-y-1 hover:border-yellow-500/40
      `}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* ✨ Glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: hover ? 0.45 : 0,
          backgroundImage: `
            radial-gradient(circle at 20% 25%, rgba(212,175,55,0.25), transparent 60%),
            radial-gradient(circle at 70% 65%, rgba(212,175,55,0.18), transparent 65%),
            radial-gradient(circle at 40% 80%, rgba(212,175,55,0.12), transparent 55%)
          `,
        }}
      />

      {/* ✨ Sparkles layer */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-80 sparkle-layer" />

      {/* Image */}
      <div className="relative w-full h-52 overflow-hidden">
        {thumbnail?.url ? (
          <Image
            src={thumbnail.url}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="
              object-cover
              transition-all duration-700 ease-out 
              group-hover:scale-105 group-hover:brightness-110
            "
          />
        ) : (
          <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-xs text-neutral-500">
            No image
          </div>
        )}

        {/* soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 relative z-10">
        <h3
          className="
            font-medium text-lg font-display transition-colors duration-500
            group-hover:text-yellow-400
          "
        >
          {title}
        </h3>

        <p
          className="
            text-sm text-muted mt-2 transition-all duration-500
            group-hover:opacity-100 group-hover:translate-x-1 opacity-70 translate-x-0
          "
        >
          Explore the collection →
        </p>
      </div>
    </Link>
  );
}
