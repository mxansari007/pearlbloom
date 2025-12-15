import Image from "next/image";
import Link from "next/link";
import { getHeroData } from "../libs/hero";

export default async function Hero() {
  const hero = await getHeroData();
  if (!hero) return null;

  return (
    <section className="py-20">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left content */}
        <div className="space-y-6 max-w-xl">
          <p className="kicker text-muted">New Arrival</p>

          <h1 className="text-5xl md:text-6xl font-display leading-tight">
            {hero.title}
          </h1>

          <p className="text-lg text-muted">
            {hero.subtitle}
          </p>

          <div className="flex items-center gap-4 mt-4">
            <Link href={hero.ctaLink} className="btn-cta">
              {hero.ctaLabel}
            </Link>

            <Link
              href="/about"
              className="text-sm text-muted hover:underline"
            >
              Our Story
            </Link>
          </div>

          <div className="flex gap-8 mt-8 text-sm">
            <div>
              <div className="text-xl font-semibold">500+</div>
              <div className="text-muted">Happy customers</div>
            </div>
            <div>
              <div className="text-xl font-semibold">15 yrs</div>
              <div className="text-muted">Master craftsmanship</div>
            </div>
          </div>
        </div>

        {/* Right image with SHINE */}
        <div className="relative">
          <div className="rounded-2xl overflow-hidden card">
            {/* 👇 this div is REQUIRED for shine */}
            <div className="img-wrap relative h-[520px] w-full">
              {hero.heroImage?.url && (
                <Image
                  src={hero.heroImage.url}
                  alt={hero.title}
                  fill
                  priority
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
