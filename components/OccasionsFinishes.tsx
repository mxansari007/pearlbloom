import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Gem, Droplets, Circle, Sparkles, Moon } from "lucide-react";
import type { OccasionMedia } from "../libs/hero.server";

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=70`;

const OCCASIONS: { slug: string; label: string; desc: string; img: string; src?: string; bg: string }[] = [
  { slug: "daily-wear", label: "Daily Wear", desc: "Ultralight comfort studs and loops for continuous wear", img: "photo-1515562141207-7a88fb7ce338", src: "/daily-wear.png", bg: "#8a7a5c" },
  { slug: "office-wear", label: "Office Wear", desc: "Refined, minimalist classics for the formal weekday wardrobe", img: "photo-1522312346375-d1a52e2b99b3", src: "/office-wear.png", bg: "#4b5563" },
  { slug: "party-wear", label: "Party Wear", desc: "Vibrant, light-catching statements for dazzling evenings", img: "photo-1602173574767-37ac01994b2a", src: "/party-wear.png", bg: "#b07a2e" },
  { slug: "festive-wear", label: "Festive Wear", desc: "Traditional motifs and festive sparkle for every celebration", img: "photo-1523170335258-f5ed11844a49", src: "/festive-wear.png", bg: "#7e2d3a" },
  { slug: "gift", label: "Gift Guide", desc: "Thoughtful, gift-ready picks they'll love to open", img: "photo-1549465220-1a8b9238cd48", src: "/gift.png", bg: "#a85a7a" },
  { slug: "set", label: "Earring Set Bundles", desc: "Coordinated multi-pair sets at one easy price", img: "photo-1535632066927-ab7c9ab60908", src: "/earrings-set.png", bg: "#2a241d" },
];

const FINISHES = [
  { slug: "anti-tarnish", label: "Anti-Tarnish", desc: "Protective coating that keeps the shine for longer", tag: "Lasting Shine", icon: ShieldCheck },
  { slug: "gold-plated", label: "Gold Plated", desc: "Warm gold-tone shine over a durable core", tag: "Everyday Gold", icon: Gem },
  { slug: "waterproof", label: "Water-Resistant", desc: "Built for sweat, rain and everyday splashes", tag: "Active Days", icon: Droplets },
  { slug: "pearl", label: "Faux Pearl", desc: "Soft-lustre faux and shell pearls", tag: "Timeless", icon: Circle },
  { slug: "silver-tone", label: "Silver Tone", desc: "Bright, cool-toned modern finish", tag: "Contemporary", icon: Sparkles },
  { slug: "oxidised", label: "Oxidised", desc: "Antique-finish silver-tone with heritage depth", tag: "Heritage Look", icon: Moon },
];

function SectionHead({ kicker, title, href, cta }: { kicker: string; title: string; href: string; cta: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.24em] mb-2" style={{ color: "rgb(var(--bronze-rgb))" }}>
          {kicker}
        </span>
        <h2 className="font-display italic text-2xl md:text-3xl" style={{ color: "var(--fg)", fontWeight: 400 }}>
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold transition-colors"
        style={{ color: "rgb(var(--bronze-rgb))" }}
      >
        {cta}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

export default function OccasionsFinishes({ occasions }: { occasions?: OccasionMedia }) {
  return (
    <section className="relative" style={{ background: "var(--bg)" }}>
      <div className="container py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-14">
          {/* Shop by Occasion */}
          <div>
            <SectionHead kicker="Dressed for Life" title="Shop by Occasion" href="/earrings" cta="View all Occasions" />
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {OCCASIONS.map((o) => {
                const ov = occasions?.[o.slug];
                const imgSrc = ov?.url || o.src || UNSPLASH(o.img);
                const imgAlt = ov?.alt?.trim() || `${o.label} earrings`;
                return (
                <Link
                  key={o.slug}
                  href={`/earrings/occasion/${o.slug}`}
                  className="occasion-card group relative block overflow-hidden rounded-2xl aspect-[4/3]"
                  style={{ backgroundColor: o.bg }}
                >
                  <Image
                    src={imgSrc}
                    alt={imgAlt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="occasion-card__img object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05))" }}
                  />
                  <div className="occasion-card__tint absolute inset-0" />
                  <div className="absolute inset-0 flex flex-col justify-end p-3.5 md:p-4">
                    <span className="occasion-card__badge self-start rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                      {o.label}
                    </span>
                    <p className="occasion-card__desc leading-snug">{o.desc}</p>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>

          {/* Explore Our Finishes */}
          <div>
            <SectionHead kicker="Made to Last" title="Explore Our Finishes" href="/earrings" cta="View all Finishes" />
            <div className="space-y-2.5">
              {FINISHES.map(({ slug, label, desc, tag, icon: Icon }) => (
                <Link
                  key={slug}
                  href={`/earrings/finish/${slug}`}
                  className="finish-card group flex items-center gap-3 rounded-xl px-4 py-3"
                >
                  <span className="finish-card__icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="finish-card__label text-[12.5px] font-bold uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="finish-card__desc leading-snug truncate">
                      {desc}
                    </p>
                  </div>
                  <span className="finish-card__tag shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider">
                    {tag}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
