export const metadata = {
  title: "Warranty & Care — Pearl Bloom",
  description: "Care instructions and warranty information for your jewelry.",
};

export default function WarrantyAndCarePage() {
  return (
    <main className="container py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-display">Warranty & Care</h1>
        <p className="text-muted mt-3">
          Simple care steps help your jewelry stay beautiful for years.
        </p>

        <div className="mt-8 space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-medium">Care guidelines</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Avoid contact with perfume, sanitizer, and harsh chemicals</li>
              <li>Store pieces separately to prevent scratches</li>
              <li>Use a soft cloth for gentle cleaning after use</li>
              <li>Remove jewelry before swimming, gym, or heavy household work</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Polishing & small repairs</h2>
            <p className="text-sm text-muted mt-2">
              We can help with polishing and small repairs depending on the piece and condition. For support, contact us with
              photos and your order ID.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Resizing</h2>
            <p className="text-sm text-muted mt-2">
              If resizing is supported for your piece, we’ll guide you through the process. Charges and timelines depend on the
              design and size change.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Need help?</h2>
            <p className="text-sm text-muted mt-2">
              Reach out via{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

