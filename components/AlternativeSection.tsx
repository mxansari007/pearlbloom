type Card = {
  badge: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  desc: string;
  footer: string;
  footerColor: string;
  highlight?: boolean;
};

const CARDS: Card[] = [
  {
    badge: "Unsafe Fashion Base",
    badgeBg: "rgba(220,38,38,0.10)",
    badgeText: "#b91c1c",
    title: "Cheap Brass Alloys",
    desc: "Often ₹100–₹250, but cheap alloys can irritate skin and peel within weeks — leaving the nickel underneath that turns earlobes green.",
    footer: "✕ Lifetime Cost: High (disposed fast)",
    footerColor: "var(--muted)",
  },
  {
    badge: "The Sweet Spot",
    badgeBg: "rgba(22,163,74,0.12)",
    badgeText: "#15803d",
    title: "Anti-Tarnish & Skin-Safe",
    desc: "Most pieces under ₹499 (sets under ₹999). Skin-safe alloy, copper and steel bases with gold-tone plating and an anti-tarnish coating — light, hypoallergenic and water-resistant for daily wear.",
    footer: "✓ Cost-per-wear: about ₹1 a day",
    footerColor: "#15803d",
    highlight: true,
  },
  {
    badge: "Overpriced Fine Jewelry",
    badgeBg: "rgba(217,119,6,0.12)",
    badgeText: "#b45309",
    title: "Pure Gold Houses",
    desc: "Priced upwards of ₹15,000. Stunning, but too precious for casual wear — one loss down a drain or in a gym locker is a costly one.",
    footer: "✕ Risk Factor: extremely high",
    footerColor: "var(--muted)",
  },
];

export default function AlternativeSection() {
  return (
    <section className="relative alternative-section">
      <div className="container py-16 md:py-20">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "rgb(var(--bronze-rgb))" }}
          >
            The Smart Alternative
          </span>
          <h2
            className="font-display italic text-2xl md:text-4xl leading-[1.18] mt-4"
            style={{ color: "var(--fg)", fontWeight: 400 }}
          >
            Why overpay for solid gold — or risk cheap brass that turns your ears green?
          </h2>
        </div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-3 items-stretch">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="relative rounded-2xl p-6 flex flex-col"
              style={{
                background: c.highlight ? "var(--alternative-card-highlight-bg)" : "var(--alternative-card-bg)",
                border: c.highlight
                  ? "1px solid rgb(var(--wine-rgb))"
                  : "1px solid var(--hero-card-border)",
                boxShadow: c.highlight ? "0 18px 40px rgba(0,0,0,0.10)" : "none",
              }}
            >
              {c.highlight && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                  style={{ background: "rgb(var(--bronze-rgb))" }}
                >
                  Pearl Bloom Standard
                </span>
              )}

              <span
                className="self-start rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider mb-4 mt-1"
                style={{ background: c.badgeBg, color: c.badgeText }}
              >
                {c.badge}
              </span>

              <h3 className="font-display text-lg mb-3" style={{ color: "var(--fg)" }}>
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--muted)" }}>
                {c.desc}
              </p>

              <p
                className="mt-5 pt-4 text-[11px] font-bold uppercase tracking-wider"
                style={{ color: c.footerColor, borderTop: "1px solid var(--hero-hairline)" }}
              >
                {c.footer}
              </p>
            </div>
          ))}
        </div>

        <p className="text-justify italic text-sm max-w-3xl" style={{ color: "var(--muted)", marginTop: "15px", textAlignLast: "center", marginLeft: "auto", marginRight: "auto" }}>
          &ldquo;We took out the expensive boutique packaging, celebrity endorsement fees, and mall
          retail rents to build beautiful, anti-tarnish earrings for your everyday schedule.&rdquo;
        </p>
      </div>
    </section>
  );
}
