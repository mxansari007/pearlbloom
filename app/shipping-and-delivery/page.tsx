export const metadata = {
  title: "Shipping & Delivery — Pearl Bloom",
  description: "Shipping and delivery timelines, charges, and order dispatch details.",
};

export default function ShippingAndDeliveryPage() {
  return (
    <main className="container py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-display">Shipping & Delivery</h1>
        <p className="text-muted mt-3">
          Clear delivery timelines and charges help you shop with confidence.
        </p>

        <div className="mt-8 space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-medium">Dispatch timeline</h2>
            <p className="text-sm text-muted mt-2">
              Orders are typically dispatched within 24–72 hours (excluding Sundays and public holidays). For made-to-order
              or custom pieces, dispatch timelines may be longer and will be communicated before confirmation.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Delivery timeline</h2>
            <p className="text-sm text-muted mt-2">
              Delivery timelines depend on your pincode and courier serviceability. Most metro locations deliver faster, while
              remote areas may take additional time.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Metros & major cities: 2–5 business days</li>
              <li>Other cities: 3–7 business days</li>
              <li>Remote areas: 5–10 business days</li>
            </ul>
            <p className="text-xs text-muted mt-4">
              These are estimates. Actual timelines may vary due to weather, local restrictions, courier delays, or peak seasons.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Shipping charges</h2>
            <p className="text-sm text-muted mt-2">
              Shipping charges (if applicable) are shown in your cart/checkout before you pay. Free shipping offers, when active,
              apply automatically once your order value qualifies.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Tracking</h2>
            <p className="text-sm text-muted mt-2">
              Once dispatched, you can track your order from the Orders section in your account. If you need help, reach us at{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

