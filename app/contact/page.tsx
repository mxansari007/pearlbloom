// src/app/contact/page.tsx
import type { ReactNode } from 'react'
import ContactForm from '../../components/ContactForm' // client component
import Link from 'next/link'

export const metadata = {
  title: 'Contact — Pearl Bloom',
  description: 'Contact Pearl Bloom — handcrafted jewelry. Reach out for orders, custom work, wholesale, or lifetime care.',
  openGraph: {
    title: 'Contact — Pearl Bloom',
    description: 'Contact Pearl Bloom — handcrafted jewelry. Reach out for orders, custom work, wholesale, or lifetime care.'
  }
}

export default function ContactPage(): ReactNode {
  // replace these placeholders in your copy when you want
  const business = {
    name: 'Pearl Bloom',
    email: 'hello@pearlbloom.in',
    phone: '+91 98765 43210',
    address: {
      line1: '76, Delhi Road',
      line2: 'Bulandshahr, India',
      postal: '203001'
    },
    hours: [
      'Mon–Fri: 10:00 — 19:00',
      'Sat: 11:00 — 17:00',
      'Sun: Closed / By appointment'
    ],
    insta: 'https://instagram.com/yourhandle',
    facebook: 'https://facebook.com/yourhandle',
    pinterest: 'https://pinterest.com/yourhandle'
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    name: business.name,
    url: typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SITE_URL ?? '') : '',
    telephone: business.phone,
    email: business.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${business.address.line1}, ${business.address.line2}`,
      postalCode: business.address.postal,
      addressLocality: 'Bulandshahr',
      addressCountry: 'IN'
    },
    openingHours: business.hours.map((h) => h.replace(' — ', '')),
    sameAs: [business.insta, business.facebook, business.pinterest]
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="container py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left column — form */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-display">Get in touch</h1>
              <p className="text-muted mt-2 max-w-xl">
                Whether you have a question about an order, want a custom piece, or need lifetime care for your heirloom,
                we’re here to help. Fill the form below or use the direct contact details on the right.
              </p>
            </div>

            <div className="card p-6">
              <ContactForm contactEmail={business.email} />
            </div>

            {/* FAQ */}
            <section className="mt-8">
              <h2 className="text-xl font-display mb-3">Frequently asked</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <details className="card p-4">
                  <summary className="font-medium cursor-pointer">How long does custom work take?</summary>
                  <div className="mt-2 text-sm text-muted">
                    Typical lead time is 3–6 weeks depending on the design. We will provide a timeline before production begins.
                  </div>
                </details>

                <details className="card p-4">
                  <summary className="font-medium cursor-pointer">Do you offer resizing or lifetime care?</summary>
                  <div className="mt-2 text-sm text-muted">
                    Yes — lifetime polishing, small repairs, and one complimentary resize within 6 months for select items. Terms apply.
                  </div>
                </details>

                <details className="card p-4">
                  <summary className="font-medium cursor-pointer">Can I buy directly from you?</summary>
                  <div className="mt-2 text-sm text-muted">
                    We sell through verified marketplaces and direct channels. If an item is not listed, contact us and we’ll assist with purchase options.
                  </div>
                </details>

                <details className="card p-4">
                  <summary className="font-medium cursor-pointer">Wholesale & retail partnerships</summary>
                  <div className="mt-2 text-sm text-muted">
                    We welcome trade partnerships. Please include "Wholesale" in the subject and provide company credentials.
                  </div>
                </details>
              </div>
            </section>
          </div>

          {/* Right column — business info + social + map */}
          <aside className="space-y-6">
            <div className="card p-5">
              <h3 className="font-display text-lg">Pearl Bloom</h3>
              <div className="text-sm text-muted mt-2">
                <div>{business.address.line1}</div>
                <div>{business.address.line2}</div>
                <div>{business.address.postal}</div>
              </div>

              <div className="mt-4 text-sm">
                <div><strong>Email:</strong> <a href={`mailto:${business.email}`} className="underline">{business.email}</a></div>
                <div className="mt-2"><strong>Phone:</strong> <a href={`tel:${business.phone}`} className="underline">{business.phone}</a></div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-muted">Hours</div>
                <ul className="mt-2 text-sm">
                  {business.hours.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
            </div>

            <div className="card p-4">
              <h4 className="font-medium">Follow us</h4>
              <div className="flex gap-3 mt-3">
                <a href={business.insta} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full w-10 h-10 flex items-center justify-center bg-white/6 hover:bg-white/8 transition">IG</a>
                <a href={business.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full w-10 h-10 flex items-center justify-center bg-white/6 hover:bg-white/8 transition">FB</a>
                <a href={business.pinterest} target="_blank" rel="noreferrer" aria-label="Pinterest" className="rounded-full w-10 h-10 flex items-center justify-center bg-white/6 hover:bg-white/8 transition">PT</a>
              </div>
            </div>

            <div className="card p-0 overflow-hidden">
              <iframe
                title="Store location"
                src="https://www.google.com/maps?q=1,+54,+bhoot,+Nazimpura,+Yamunapuram,+Bulandshahr,+India&output=embed"
                className="w-full h-48 border-0"
                loading="lazy"
              />
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
