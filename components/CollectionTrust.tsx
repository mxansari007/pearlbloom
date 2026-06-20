import Link from "next/link";
import { ShieldCheck, Sparkles, Truck, BadgeCheck } from "lucide-react";

/**
 * Shared E-E-A-T (Experience · Expertise · Authoritativeness · Trust) block.
 * Rendered on every earrings collection page and the All Earrings hub. It is
 * deliberately honest about what the jewellery is (gold-tone / gold-plated
 * fashion jewellery, not solid gold), names the real materials as entities, and
 * interlinks to the policy / care pages that back the claims up.
 */
const POINTS = [
  {
    icon: Sparkles,
    title: "Honest materials, clearly stated",
    body: "Skin-safe, nickel-free and lead-free alloy, copper and stainless-steel cores, finished with anti-tarnish gold-tone and 18K-style gold plating. It's fashion jewellery made to look luxe — never sold as solid gold or hallmarked.",
  },
  {
    icon: BadgeCheck,
    title: "Made for everyday wear",
    body: "Lightweight, hypoallergenic designs that suit sensitive ears, with water-resistant finishes built for sweat, rain and daily life. Each piece is quality-checked before it's dispatched.",
  },
  {
    icon: Truck,
    title: "Tracked, secure delivery",
    body: "Orders ship with tracking across India and are paid for securely via Razorpay — your full card and UPI details are never stored on our servers.",
  },
  {
    icon: ShieldCheck,
    title: "Backed after you buy",
    body: "A 48-hour damage-protection plan on eligible premium pieces, clear returns on damaged or wrong items, and a responsive team you can actually reach.",
  },
];

const GUIDES: { href: string; label: string }[] = [
  { href: "/earrings", label: "All Earrings" },
  { href: "/warranty-and-care", label: "Warranty & Care" },
  { href: "/returns-and-refunds", label: "Returns & Refunds" },
  { href: "/shipping-and-delivery", label: "Shipping & Delivery" },
  { href: "/blog", label: "The Journal" },
  { href: "/contact", label: "Contact Us" },
];

export default function CollectionTrust() {
  return (
    <section
      className="container py-12 md:py-16"
      style={{ borderTop: "1px solid var(--hero-hairline)" }}
      aria-labelledby="why-pearl-bloom"
    >
      <div className="max-w-3xl">
        <h2
          id="why-pearl-bloom"
          className="font-display italic text-2xl md:text-3xl mb-4"
          style={{ color: "var(--fg)", fontWeight: 400 }}
        >
          Why shop earrings with Pearl Bloom
        </h2>
        <p className="text-base leading-relaxed mb-8" style={{ color: "var(--muted)" }}>
          Pearl Bloom is an India-based earrings label focused on one thing — beautiful,
          skin-safe, anti-tarnish fashion earrings at honest prices. We&apos;re upfront about how
          every pair is made and stand behind it after you buy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
        {POINTS.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="rounded-2xl p-5"
              style={{
                background: "var(--hero-card)",
                border: "1px solid var(--hero-card-border)",
              }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                  style={{ background: "rgba(94,24,48,0.08)", color: "#5e1830" }}
                >
                  <Icon size={15} />
                </span>
                <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                  {p.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {p.body}
              </p>
            </div>
          );
        })}
      </div>

      {/* Authority / trust interlinks to the pages that back the claims up. */}
      <nav className="mt-8 max-w-4xl" aria-label="Helpful guides and policies">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.16em] mb-3"
          style={{ color: "var(--fg)" }}
        >
          Helpful guides &amp; policies
        </p>
        <ul className="flex flex-wrap gap-2.5">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="inline-block rounded-full px-4 py-2 text-sm transition-all duration-150 hover:-translate-y-0.5"
                style={{
                  border: "1px solid var(--hero-card-border)",
                  background: "var(--hero-card)",
                  color: "rgb(var(--bronze-rgb))",
                }}
              >
                {g.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
