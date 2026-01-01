import Image from "next/image";
import Link from "next/link";
import type { HeroData } from "../libs/hero.server";

export default function Hero({ hero }: { hero: HeroData | null }) {
  if (!hero) return null

  return (
    <section className="py-20">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left content */}
        <div className="space-y-6 max-w-xl">
          <p className="kicker text-muted">New Arrival</p>

          <h1 className="text-5xl md:text-6xl font-display leading-tight">
            {hero.title}
          </h1>

          <p className="text-lg text-muted">{hero.subtitle}</p>

          <div className="flex items-center gap-4 mt-4">
            <Link href={hero.ctaLink} className="btn-cta">
              {hero.ctaLabel}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {[
              "Secure payments",
              "Easy returns",
              "Fast delivery",
              "WhatsApp support",
            ].map((t) => (
              <span
                key={t}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(var(--gold-rgb),0.10)",
                  border: "1px solid rgba(var(--gold-rgb),0.22)",
                  color: "rgb(var(--gold-rgb))",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right image with shine */}
        <div className="relative">
          <div className="rounded-2xl overflow-hidden card">
            <div className="img-wrap relative h-[520px] w-full">
              {hero.heroImage?.url && (
                <Image
                  src={hero.heroImage.url}
                  alt={hero.title}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover hero-float"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
