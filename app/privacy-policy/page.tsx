export const metadata = {
  title: "Privacy Policy — Pearl Bloom",
  description:
    "How Pearl Bloom collects, uses, shares, and protects your personal information, and the choices and rights you have.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="container py-14">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-display">Privacy Policy</h1>
        <p className="text-muted mt-3">
          We respect your privacy and collect only what we need to fulfil your order, support you,
          and improve your experience. This policy explains what we collect, why, who we share it
          with, and the choices you have.
        </p>

        <div className="mt-8 space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-medium">Information we collect</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <strong>Order &amp; account details:</strong> your name, phone number, email, and
                billing/shipping address.
              </li>
              <li>
                <strong>Order history:</strong> the items you buy and your past orders.
              </li>
              <li>
                <strong>Support messages:</strong> conversations you start with us via chat, email,
                or the contact form.
              </li>
              <li>
                <strong>Device &amp; usage data:</strong> IP address, browser type, device, and
                basic activity on the site (collected automatically via cookies and similar tools).
              </li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">How we collect it</h2>
            <p className="text-sm text-muted mt-2">
              We collect information you give us directly (at checkout, sign-up, or support), and
              automatically through cookies, log files, and tracking pixels as you browse.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">How we use your information</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>To process and deliver your orders, returns, and refunds</li>
              <li>To provide customer support and respond to your requests</li>
              <li>To prevent fraud and keep the platform secure</li>
              <li>To send order updates and, where you have opted in, marketing messages</li>
              <li>To understand how the site is used and improve it</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Payments</h2>
            <p className="text-sm text-muted mt-2">
              Payments are processed securely by our payment provider, Razorpay. Your card, UPI, and
              banking details are handled by the provider — we do <strong>not</strong> store your
              full payment details on our servers.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Cookies &amp; analytics</h2>
            <p className="text-sm text-muted mt-2">
              We use cookies and similar technologies to keep the site working (e.g. your cart and
              login), to measure performance, and to make our marketing more relevant. We also use
              third-party analytics and advertising tools (such as Google Analytics and the Meta
              Pixel). You can control cookies through your browser settings and opt out of
              personalised ads via the relevant ad platform&apos;s settings.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Sharing your information</h2>
            <p className="text-sm text-muted mt-2">
              We do not sell your personal information. We share it only with trusted service
              providers who help us run the store, and only as needed:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Payment processing (Razorpay)</li>
              <li>Order fulfilment and delivery partners</li>
              <li>Hosting, database, and infrastructure providers</li>
              <li>Analytics and advertising providers</li>
              <li>Authorities, where required by law or to protect our rights and users</li>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Data retention</h2>
            <p className="text-sm text-muted mt-2">
              We keep your order and account information for as long as your account is active or as
              needed to provide our services and meet legal, tax, and accounting requirements. You
              can ask us to delete your data (see your rights below).
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Security</h2>
            <p className="text-sm text-muted mt-2">
              We use reasonable technical and organisational measures to protect your information.
              No method of transmission or storage is 100% secure, but we work to safeguard your
              data and limit access to it.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Your rights &amp; choices</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Access, correct, or update your personal information</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing messages at any time</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-sm text-muted mt-3">
              To exercise any of these, contact us via{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a>. We&apos;ll
              respond within a reasonable timeframe.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Children&apos;s privacy</h2>
            <p className="text-sm text-muted mt-2">
              Our store is intended for adults. We do not knowingly collect personal information
              from children. If you believe a child has provided us data, please contact us and we
              will remove it.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Changes to this policy</h2>
            <p className="text-sm text-muted mt-2">
              We may update this policy from time to time. The latest version will always be posted
              on this page, so please check back periodically.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-medium">Contact</h2>
            <p className="text-sm text-muted mt-2">
              For any privacy questions or requests, reach us through{" "}
              <a href="/contact" className="underline underline-offset-2">Contact</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
