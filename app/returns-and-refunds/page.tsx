export const metadata = {
  title: "Returns & Refunds — Pearl Bloom",
  description: "Return, exchange, and refund policy for purchases.",
};

export default function ReturnsAndRefundsPage() {
  return (
    <main className="container py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-display">Returns & Refunds</h1>
        <p className="text-muted mt-3">
          We aim to keep returns simple and transparent.
        </p>

        <div className="mt-8 space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-medium">Eligibility window</h2>
            <p className="text-sm text-muted mt-2">
              Returns or exchanges can be requested within 7 days of delivery for eligible items, provided the product is unused,
              unaltered, and returned with original packaging.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Non-returnable items</h2>
            <p className="text-sm text-muted mt-2">
              For hygiene and safety reasons, certain items (like earrings) may be non-returnable once delivered. Made-to-order,
              engraved, or customized items are typically non-returnable unless they arrive damaged or incorrect.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Damaged or wrong item</h2>
            <p className="text-sm text-muted mt-2">
              If your order arrives damaged, defective, or incorrect, please contact us within 48 hours of delivery with photos
              and the order ID. We’ll arrange a replacement or refund based on verification.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Refund timeline</h2>
            <p className="text-sm text-muted mt-2">
              Once the return is received and verified, refunds are typically processed within 3–7 business days. Bank/UPI posting
              timelines may vary by payment method.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">How to request a return</h2>
            <p className="text-sm text-muted mt-2">
              Visit your Orders page to view your order details. If you need help initiating a return, contact us via{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

