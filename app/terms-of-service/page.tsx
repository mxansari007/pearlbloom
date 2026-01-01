export const metadata = {
  title: "Terms of Service — Pearl Bloom",
  description: "Terms and conditions for using Pearl Bloom and placing orders.",
};

export default function TermsOfServicePage() {
  return (
    <main className="container py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-display">Terms of Service</h1>
        <p className="text-muted mt-3">
          These terms help set clear expectations for purchases and platform usage.
        </p>

        <div className="mt-8 space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-medium">Orders</h2>
            <p className="text-sm text-muted mt-2">
              Orders are confirmed after successful payment. We may cancel and refund an order in rare cases such as inventory
              mismatch, pricing errors, or suspected fraud.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Pricing</h2>
            <p className="text-sm text-muted mt-2">
              Prices are shown in INR and may change without prior notice. Applicable taxes and shipping charges are shown at
              checkout where relevant.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Returns & refunds</h2>
            <p className="text-sm text-muted mt-2">
              Returns and refunds are governed by our{" "}
              <a href="/returns-and-refunds" className="underline underline-offset-2">Returns & Refunds</a> policy.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Support</h2>
            <p className="text-sm text-muted mt-2">
              If you need help, visit{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

