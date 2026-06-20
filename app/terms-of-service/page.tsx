export const metadata = {
  title: "Terms of Service — Pearl Bloom",
  description:
    "The terms and conditions for using the Pearl Bloom website and placing orders.",
};

export default function TermsOfServicePage() {
  return (
    <main className="container py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-display">Terms of Service</h1>
        <p className="text-muted mt-3">
          These terms govern your use of the Pearl Bloom website and the purchase of our products.
          By browsing or ordering from us, you agree to the terms below.
        </p>

        <div className="mt-8 space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-medium">1. Acceptance of these terms</h2>
            <p className="text-sm text-muted mt-2">
              By accessing this website, creating an account, or placing an order, you confirm that
              you have read, understood, and agree to be bound by these Terms of Service and our{" "}
              <a href="/privacy-policy" className="underline underline-offset-2">Privacy Policy</a>.
              If you do not agree, please do not use the site.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">2. Eligibility</h2>
            <p className="text-sm text-muted mt-2">
              You must be at least 18 years old (or have the consent and supervision of a parent or
              legal guardian) to place an order. By ordering, you confirm the information you provide
              is accurate and complete.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">3. Your account</h2>
            <p className="text-sm text-muted mt-2">
              You are responsible for keeping your account details and login secure, and for all
              activity that happens under your account. Please notify us promptly of any unauthorised
              use.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">4. Products &amp; descriptions</h2>
            <p className="text-sm text-muted mt-2">
              Pearl Bloom sells fashion (imitation) jewellery. Our pieces are gold-tone and
              gold-plated over base materials such as alloy, copper, or steel — they are{" "}
              <strong>not solid gold and are not hallmarked</strong>, and stones are decorative, not
              precious. We work hard to show products accurately, but colours, finishes, and sizes
              may vary slightly from your screen and from piece to piece. Product availability is not
              guaranteed and may change at any time.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">5. Orders &amp; acceptance</h2>
            <p className="text-sm text-muted mt-2">
              An order is confirmed once payment is successfully processed. We may refuse, cancel, or
              limit an order in rare cases — for example, stock unavailability, pricing or listing
              errors, or suspected fraud. If we cancel a paid order, we will refund the amount paid.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">6. Pricing &amp; payment</h2>
            <p className="text-sm text-muted mt-2">
              Prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless
              stated otherwise; shipping charges, where applicable, are shown at checkout. Prices and
              offers may change without notice. Payments are processed securely by our payment
              provider, Razorpay — we do not store your full card or banking details.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">7. Shipping &amp; delivery</h2>
            <p className="text-sm text-muted mt-2">
              Delivery timelines are estimates and may vary due to location, courier, or factors
              beyond our control. See our{" "}
              <a href="/shipping-and-delivery" className="underline underline-offset-2">
                Shipping &amp; Delivery
              </a>{" "}
              policy for details.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">8. Returns &amp; refunds</h2>
            <p className="text-sm text-muted mt-2">
              Returns and refunds are governed by our{" "}
              <a href="/returns-and-refunds" className="underline underline-offset-2">
                Returns &amp; Refunds
              </a>{" "}
              policy, which forms part of these terms.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">9. Intellectual property</h2>
            <p className="text-sm text-muted mt-2">
              All content on this site — including the Pearl Bloom name, logo, designs, text, and
              images — belongs to Pearl Bloom or its licensors and is protected by law. You may not
              copy, reproduce, or use it for commercial purposes without our written permission.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">10. Acceptable use</h2>
            <p className="text-sm text-muted mt-2">
              You agree not to misuse the site — including attempting to disrupt it, access it
              without authorisation, submit false information, or use it for any unlawful purpose.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">11. Disclaimers &amp; limitation of liability</h2>
            <p className="text-sm text-muted mt-2">
              The site and products are provided on an &ldquo;as is&rdquo; basis. As fashion
              jewellery, longevity depends on care and handling (see care guidance on product pages).
              To the maximum extent permitted by law, Pearl Bloom is not liable for indirect or
              consequential losses, and our total liability for any order is limited to the amount
              you paid for that order.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">12. Governing law</h2>
            <p className="text-sm text-muted mt-2">
              These terms are governed by the laws of India, and any disputes are subject to the
              jurisdiction of the competent courts in India.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">13. Changes to these terms</h2>
            <p className="text-sm text-muted mt-2">
              We may update these terms from time to time. The current version will always be posted
              on this page; please review it periodically.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">14. Contact</h2>
            <p className="text-sm text-muted mt-2">
              Questions about these terms? Reach us through{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a> or email{" "}
              <a href="mailto:info@pearlbloom.in" className="underline underline-offset-2">
                info@pearlbloom.in
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
