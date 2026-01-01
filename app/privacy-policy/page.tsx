export const metadata = {
  title: "Privacy Policy — Pearl Bloom",
  description: "How Pearl Bloom collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="container py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-display">Privacy Policy</h1>
        <p className="text-muted mt-3">
          We respect your privacy and collect only what we need to fulfill your order and improve your experience.
        </p>

        <div className="mt-8 space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-medium">Data we collect</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>Account details: phone number, name, and optional email</li>
              <li>Order details: items purchased, delivery address, and order history</li>
              <li>Support messages: conversations you initiate via support/chat</li>
              <li>Usage analytics: basic events to understand product performance</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Payments</h2>
            <p className="text-sm text-muted mt-2">
              Payments are processed by our payment provider. We do not store your card details on our servers.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">How we use data</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>To process orders, deliveries, returns, and customer support</li>
              <li>To prevent fraud and ensure platform security</li>
              <li>To improve products and website experience</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Contact</h2>
            <p className="text-sm text-muted mt-2">
              For privacy-related questions or requests, reach us at{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

