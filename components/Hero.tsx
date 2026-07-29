import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Star, Sparkles, User } from "lucide-react";
import type { HeroData } from "../libs/hero.server";

// Hidden until we have REAL customer reviews. When real ratings exist, set this
// to true and replace the placeholder numbers (4.8 / 1,420+) below with real data.
const SHOW_SOCIAL_PROOF = false;

const features = ["Skin-Safe", "Anti-Tarnish", "Water-Resistant"];
const avatarGradients = [
  "linear-gradient(135deg,#e8c9a0,#b98a5e)",
  "linear-gradient(135deg,#d8b48c,#a87d52)",
  "linear-gradient(135deg,#e3c1a6,#caa477)",
];

export default function Hero({ hero }: { hero: HeroData | null }) {
  // The hero CTA link is admin-configurable. Treat blank or the legacy
  // "/products" value as the redesigned catalog so the button never points at
  // the old page; any other custom link the admin sets is respected.
  const rawCta = hero?.ctaLink?.trim();
  const ctaLink = !rawCta || rawCta === "/products" ? "/earrings" : rawCta;

  // Featured image is admin-configurable (Settings → Hero). Fall back to the
  // bundled image, which has its caption baked in — so only render the caption
  // overlay when a custom image is set.
  const usingCustomImage = !!hero?.heroImage?.url;
  const lightImg = hero?.heroImage?.url || "/newearring.png";
  // Dark-mode image is optional; when set, both layers are stacked and CSS
  // crossfades between them as the theme toggles.
  const hasDarkImg = !!hero?.heroImageDark?.url;
  const darkImg = hero?.heroImageDark?.url || lightImg;
  const featLabel = hero?.featuredLabel?.trim() || "Featured Earring";
  const featName = hero?.featuredName?.trim() || "";
  const heroAlt = usingCustomImage
    ? featName
      ? `Featured earring — ${featName}`
      : "Featured earring"
    : "Featured earring — Riviera ridged Gold Hoops";

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom, var(--hero-grad-1), var(--hero-grad-2))" }}
    >
      {/* soft ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-24 right-1/3 w-[520px] h-[520px] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, rgba(var(--gold-rgb),0.16), transparent 70%)" }}
        />
      </div>

      <div className="container relative z-10 py-14 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Text */}
          <div className="max-w-xl">
            {/* Pill kicker */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-7 animate-fade-in-up"
              style={{ border: "1px solid var(--hero-card-border)", background: "var(--hero-card)" }}
            >
              <Sparkles size={13} style={{ color: "rgb(var(--bronze-rgb))" }} />
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "rgb(var(--bronze-rgb))" }}
              >
                Skin-Safe. Lightweight. Anti-Tarnish.
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display tracking-tight leading-[1.08] text-4xl sm:text-5xl lg:text-[3.4rem] animate-fade-in-up"
              style={{ color: "var(--fg)", fontWeight: 400, animationDelay: "0.1s" }}
            >
              Wear the <span className="italic">Warmth</span> of{" "}
              <span style={{ color: "rgb(var(--gold-soft-rgb))" }}>Everyday Gold</span>{" "}
              <span className="italic">Comfort.</span>
            </h1>

            {/* Subtitle */}
            <p
              className="mt-6 text-base sm:text-lg leading-relaxed max-w-lg animate-fade-in-up"
              style={{ color: "var(--muted)", animationDelay: "0.2s" }}
            >
              Gold-tone earrings made to be kind to sensitive ears — anti-tarnish, lightweight and
              water-resistant for real daily life. Skin-safe, hypoallergenic and honestly priced, with
              no luxury markups.
            </p>

            {/* Feature checks */}
            <div
              className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              {features.map((f) => (
                <div key={f} className="inline-flex items-center gap-2">
                  <Check size={15} strokeWidth={2.5} style={{ color: "rgb(var(--bronze-rgb))" }} />
                  <span
                    className="text-[12px] font-semibold uppercase tracking-wider"
                    style={{ color: "rgb(var(--bronze-rgb))" }}
                  >
                    {f}
                  </span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div
              className="mt-8 flex flex-wrap items-center gap-3.5 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <Link
                href={ctaLink}
                className="group inline-flex items-center gap-2.5 rounded-lg px-7 py-4 text-sm font-bold uppercase tracking-wider text-white transition-all duration-300 hover:opacity-75 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #241a1d 0%, rgb(var(--wine-rgb)) 100%)", boxShadow: "0 14px 30px rgba(var(--wine-rgb), 0.30)" }}
              >
                Browse Full Catalog
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/earrings/best-sellers"
                className="btn-best-sellers inline-flex items-center rounded-lg px-7 py-4 text-sm font-bold uppercase tracking-wider hover:-translate-y-0.5"
                style={{ background: "var(--panel)" }}
              >
                Best Sellers
              </Link>
            </div>

            {/* Social proof — gated by SHOW_SOCIAL_PROOF (top of file). */}
            {SHOW_SOCIAL_PROOF && (
            <div
              className="mt-8 inline-flex items-center gap-4 rounded-2xl px-4 py-3 animate-fade-in-up"
              style={{
                border: "1px solid var(--hero-card-border)",
                background: "var(--hero-card)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                animationDelay: "0.5s",
              }}
            >
              {/* Avatars */}
              <div className="flex -space-x-2.5">
                {avatarGradients.map((bg, i) => (
                  <span
                    key={i}
                    className="h-9 w-9 rounded-full border-2 flex items-center justify-center shadow-sm"
                    style={{ borderColor: "var(--hero-card)", background: bg }}
                  >
                    <User size={15} className="text-white/90" />
                  </span>
                ))}
                <span
                  className="h-9 w-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold tracking-tight"
                  style={{
                    borderColor: "var(--hero-card)",
                    background: "rgba(var(--gold-rgb),0.16)",
                    color: "rgb(var(--bronze-rgb))",
                  }}
                >
                  1k+
                </span>
              </div>

              {/* Divider */}
              <span className="self-stretch w-px my-0.5" style={{ background: "var(--hero-card-border)" }} />

              {/* Rating */}
              <div className="flex flex-col items-center text-center pt-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className="fill-current" style={{ color: "rgb(var(--gold-rgb))" }} />
                    ))}
                  </div>
                  <span className="text-[15px] font-bold leading-none" style={{ color: "var(--fg)" }}>
                    4.8
                  </span>
                </div>
                <p className="text-[11px] tracking-wide mt-1.5" style={{ color: "var(--muted)" }}>
                  Vetted by{" "}
                  <span className="font-semibold" style={{ color: "rgb(var(--bronze-rgb))" }}>
                    1,420+
                  </span>{" "}
                  buyers
                </p>
              </div>
            </div>
            )}
          </div>

          {/* Image — user-provided earring.png (label is built into the image) */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative mx-auto w-full max-w-lg">
              <div
                className="relative aspect-[665/597] rounded-[1.6rem] overflow-hidden"
                style={{ background: "#ffffff", border: "1px solid var(--hero-card-border)", boxShadow: "0 30px 70px rgba(0,0,0,0.12)" }}
              >
                <Image
                  src={lightImg}
                  alt={heroAlt}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  className={`object-cover hero-img${hasDarkImg ? " hero-img-light" : ""}`}
                />

                {hasDarkImg && (
                  <Image
                    src={darkImg}
                    alt={heroAlt}
                    fill
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 1024px) 90vw, 45vw"
                    className="object-cover hero-img hero-img-dark"
                  />
                )}

                {usingCustomImage && (
                  <div
                    className="absolute bottom-2.5 left-2.5 rounded-lg px-2.5 py-1 backdrop-blur-md"
                    style={{
                      background: "var(--hero-cap-bg)",
                      border: "1px solid var(--hero-cap-border)",
                      boxShadow: "0 5px 14px rgba(44,10,20,0.14)",
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <Sparkles size={8} style={{ color: "rgb(var(--bronze-rgb))" }} />
                      <p
                        className="font-semibold uppercase"
                        style={{ color: "rgb(var(--bronze-rgb))", fontSize: "9px", letterSpacing: "0.22em", transform: "translateY(7px)" }}
                      >
                        {featLabel}
                      </p>
                    </div>
                    {featName && (
                      <p
                        className="font-display italic leading-tight"
                        style={{ color: "var(--hero-cap-name)", fontSize: "10px", letterSpacing: "0.01em", marginTop: "1px" }}
                      >
                        {featName}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
