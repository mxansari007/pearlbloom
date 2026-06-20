export const metadata = {
  title: "Warranty & Care — Pearl Bloom",
  description:
    "Pearl Bloom's 1-month warranty on eligible premium pieces, plus simple care tips to keep your jewellery looking its best.",
};

export default function WarrantyAndCarePage() {
  return (
    <main className="container py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-display">Warranty &amp; Care</h1>
        <p className="text-muted mt-3">
          We stand behind our premium pieces with a short, honest warranty — and a little care goes
          a long way in keeping your jewellery beautiful.
        </p>

        <div className="mt-8 space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-medium">1-Month Warranty</h2>
            <p className="text-sm text-muted mt-2">
              Selected premium pieces come with a <strong>1-month warranty</strong> from the date of
              delivery. To be eligible, the item must be:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Priced <strong>above ₹500</strong>, and</li>
              <li>
                Made of <strong>premium gold-plated stainless steel</strong> or{" "}
                <strong>copper with gold plating</strong>.
              </li>
            </ul>
            <p className="text-sm text-muted mt-3">
              Items priced ₹500 or below, and pieces made of other materials, are not covered by this
              warranty (but our care tips below still help them last).
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">What the warranty covers</h2>
            <p className="text-sm text-muted mt-2">
              Within the 1-month period, the warranty covers genuine{" "}
              <strong>manufacturing defects</strong> under normal, everyday use — such as a clasp or
              hook failing, or plating peeling without misuse. We&apos;ll repair or replace the
              affected piece after verification.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">What the warranty does not cover</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Normal wear, tarnishing, or fading from everyday use over time</li>
              <li>
                Damage from misuse, accidents, drops, or not following the care guidance below
              </li>
              <li>
                Exposure to water, sweat, perfume, sanitiser, or chemicals beyond the product&apos;s
                stated resistance
              </li>
              <li>Lost or stolen items, and minor variations in colour or finish</li>
              <li>Items ₹500 or below, or made of non-eligible materials</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">How to claim</h2>
            <p className="text-sm text-muted mt-2">
              Contact us within the 1-month window with your <strong>order ID</strong> and clear{" "}
              <strong>photos</strong> (and a short video if possible) showing the issue. Reach us via{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a> or email{" "}
              <a href="mailto:info@pearlbloom.in" className="underline underline-offset-2">
                info@pearlbloom.in
              </a>
              . Once verified, we&apos;ll arrange a repair or replacement.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Care guidelines</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Keep away from water, perfume, sanitiser, and harsh chemicals</li>
              <li>Put jewellery on last (after makeup &amp; perfume) and take it off first</li>
              <li>Wipe gently with a soft, dry cloth after wearing</li>
              <li>Store pieces separately in a dry box or pouch to prevent scratches</li>
              <li>Remove before swimming, the gym, sleeping, or heavy household work</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Need help?</h2>
            <p className="text-sm text-muted mt-2">
              For any warranty or care questions, reach out via{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
