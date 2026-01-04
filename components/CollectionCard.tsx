"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

/* ---------------- Types ---------------- */

type CloudinaryImage = {
  url: string;
  public_id: string;
};

type CollectionCardProps = {
  title: string;
  slug: string;
  thumbnail?: CloudinaryImage;
};

export default function CollectionCard({
  title,
  slug,
  thumbnail,
}: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${slug}`}
      className="group block relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500"
    >
      {/* Card Container */}
      <div 
        className="relative h-72 md:h-80 overflow-hidden rounded-2xl"
        style={{
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Image */}
        {thumbnail?.url ? (
          <Image
            src={thumbnail.url}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-all duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--panel-bg-soft)" }}
          >
            <span className="text-sm" style={{ color: "var(--muted)" }}>No image</span>
          </div>
        )}

        {/* Gradient Overlay - stronger for better text readability */}
        <div 
          className="absolute inset-0 transition-opacity duration-500 dark:opacity-100 opacity-30"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.15) 100%)",
          }}
        />

        {/* Gold Accent Overlay on Hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(var(--gold-rgb), 0.2), transparent 60%)",
          }}
        />

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-6 z-10">
          {/* Title */}
          <h3 
            className="collection_title text-xl md:text-2xl font-display font-bold mb-2.5 transition-transform duration-300 group-hover:-translate-y-1"
            style={{
              color: "white",
              textShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {title}
          </h3>

          {/* CTA */}
          <div 
            className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3"
            style={{ 
              color: "rgb(var(--gold-rgb))",
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
            <span>Explore Collection</span>
            <ArrowRight 
              size={16} 
              className="transition-transform duration-300 group-hover:translate-x-1" 
            />
          </div>
        </div>

        {/* Border Glow on Hover */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 0 1px rgba(var(--gold-rgb), 0.3), 0 10px 40px rgba(var(--gold-rgb), 0.1)",
          }}
        />
      </div>
    </Link>
  );
}
