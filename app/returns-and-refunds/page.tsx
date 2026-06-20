export const metadata = {
  title: "Returns & Refunds — Pearl Bloom",
  description:
    "Pearl Bloom return & refund policy: report damaged, defective, or wrong items within 2 days of delivery with an unboxing video and photos for a free replacement.",
};

export default function ReturnsAndRefundsPage() {
  return (
    <main className="container py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-display">Returns & Refunds</h1>
        <p className="text-muted mt-3">
          We want every piece to reach you in perfect condition. Please read this policy
          carefully — it explains what we can accept and the proof we need.
        </p>

        <div className="mt-8 space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-medium">2-day claim window</h2>
            <p className="text-sm text-muted mt-2">
              You can raise a return/replacement request within <strong>2 days of delivery</strong>.
              Requests made after this window cannot be accepted, as our pieces are
              affordable, everyday jewellery and prices stay low precisely because returns are kept minimal.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">What is eligible</h2>
            <p className="text-sm text-muted mt-2">
              We only accept claims for items that arrive <strong>damaged, defective, or
              incorrect</strong> (wrong product or variant). We replace such items free of charge.
            </p>
            <p className="text-sm text-muted mt-2">
              We do <strong>not</strong> accept change-of-mind returns. For hygiene and safety
              reasons, earrings cannot be returned once worn or once the seal/packaging is opened,
              except where they arrive damaged or incorrect.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Proof required</h2>
            <p className="text-sm text-muted mt-2">
              To process any damaged, defective, or wrong-item claim we need:
            </p>
            <ul className="text-sm text-muted mt-2 list-disc pl-5 space-y-1">
              <li>
                A <strong>clear, continuous unboxing video</strong> that starts before the sealed
                parcel is opened and shows the issue.
              </li>
              <li>At least <strong>two photos</strong> of the item and the issue.</li>
              <li>Your <strong>order ID</strong>.</li>
            </ul>
            <p className="text-sm text-muted mt-2">
              Without an unboxing video and photos, we are unable to verify the claim or offer a
              replacement.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Replacement &amp; refunds</h2>
            <p className="text-sm text-muted mt-2">
              Verified claims are resolved with a <strong>free replacement of the same item</strong>.
              If the same item is out of stock, we will offer an alternate piece of equal value or a
              refund. The product must be unused and returned with its original packaging and tags.
            </p>
            <p className="text-sm text-muted mt-2">
              Where a refund applies, it is processed within <strong>3–7 business days</strong> after
              we receive and verify the returned item. Bank/UPI posting times may vary by payment method.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">How to request</h2>
            <p className="text-sm text-muted mt-2">
              Visit your{" "}
              <a href="/orders" className="underline underline-offset-2">Orders</a>{" "}
              page for order details, then reach us through{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a>{" "}
              within 2 days of delivery with your order ID, unboxing video, and photos. Our team will
              guide you through the next steps.
            </p>
            <p className="text-sm text-muted mt-2">
              Returns &amp; replacements:{" "}
              <a href="mailto:returns@pearlbloom.in" className="underline underline-offset-2">
                returns@pearlbloom.in
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
