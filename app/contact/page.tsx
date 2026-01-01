// src/app/contact/page.tsx
import ContactForm from '../../components/ContactForm' // client component
import { dbAdmin } from '@/libs/firebase-admin'

export const metadata = {
  title: 'Contact — Pearl Bloom',
  description: 'Contact Pearl Bloom — handcrafted jewelry. Reach out for orders, custom work, wholesale, or lifetime care.',
  openGraph: {
    title: 'Contact — Pearl Bloom',
    description: 'Contact Pearl Bloom — handcrafted jewelry. Reach out for orders, custom work, wholesale, or lifetime care.'
  }
}

type BusinessSettings = {
  name?: string
  email?: string
  phone?: string
  address?: { line1?: string; line2?: string; postal?: string; city?: string; state?: string }
  hours?: string[]
  socials?: { instagram?: string; facebook?: string; pinterest?: string; youtube?: string; linkedin?: string; whatsapp?: string }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

function asStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null
  const out = v.filter((x) => typeof x === 'string') as string[]
  return out.length ? out : []
}

async function getBusinessFromSettings(): Promise<BusinessSettings | null> {
  try {
    const snap = await dbAdmin.collection('siteSettings').doc('main').get()
    if (!snap.exists) return null
    const data = snap.data() as unknown
    if (!isRecord(data)) return null

    const footer = isRecord(data.footer) ? data.footer : null
    const business = isRecord(data.business) ? data.business : null

    const address = business && isRecord(business.address) ? business.address : null
    const socials = business && isRecord(business.socials) ? business.socials : null
    const footerSocialsRaw = footer && Array.isArray(footer.socialLinks) ? footer.socialLinks : null
    const footerSocials = (() => {
      if (!footerSocialsRaw) return null
      const map: Record<string, string> = {}
      footerSocialsRaw.forEach((x) => {
        if (!isRecord(x)) return
        const p = asString(x.platform)
        const u = asString(x.url)
        if (!p || !u) return
        map[p] = u
      })
      return map
    })()

    return {
      name: asString(business?.name) ?? 'Pearl Bloom',
      email: asString(business?.email) ?? asString(footer?.contactEmail) ?? undefined,
      phone: asString(business?.phone) ?? asString(footer?.contactPhone) ?? undefined,
      address: address
        ? {
            line1: asString(address.line1) ?? undefined,
            line2: asString(address.line2) ?? undefined,
            postal: asString(address.postal) ?? undefined,
            city: asString(address.city) ?? undefined,
            state: asString(address.state) ?? undefined,
          }
        : undefined,
      hours: asStringArray(business?.hours) ?? undefined,
      socials: socials
        ? {
            instagram: asString(socials.instagram) ?? undefined,
            facebook: asString(socials.facebook) ?? undefined,
            pinterest: asString(socials.pinterest) ?? undefined,
            youtube: asString(socials.youtube) ?? undefined,
            linkedin: asString(socials.linkedin) ?? undefined,
            whatsapp: asString(socials.whatsapp) ?? undefined,
          }
        : footerSocials
        ? {
            instagram: asString(footerSocials.instagram) ?? undefined,
            facebook: asString(footerSocials.facebook) ?? undefined,
            pinterest: asString(footerSocials.pinterest) ?? undefined,
            youtube: asString(footerSocials.youtube) ?? undefined,
            linkedin: asString(footerSocials.linkedin) ?? undefined,
            whatsapp: asString(footerSocials.whatsapp) ?? undefined,
          }
        : undefined,
    }
  } catch {
    return null
  }
}

export default async function ContactPage() {
  const business = await getBusinessFromSettings()

  const businessFallback = {
    name: 'Pearl Bloom',
    email: '',
    phone: '',
    address: null as null | { line1: string; line2?: string; postal?: string; city?: string; state?: string },
    hours: [] as string[],
    socials: {} as Record<string, string>,
  }

  const resolvedBusiness = business ?? businessFallback

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    name: resolvedBusiness.name ?? 'Pearl Bloom',
    url: typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SITE_URL ?? '') : '',
    telephone: resolvedBusiness.phone || undefined,
    email: resolvedBusiness.email || undefined,
    address: resolvedBusiness.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: `${resolvedBusiness.address.line1 ?? ''}${resolvedBusiness.address.line2 ? `, ${resolvedBusiness.address.line2}` : ''}`,
          postalCode: resolvedBusiness.address.postal,
          addressLocality: resolvedBusiness.address.city,
          addressRegion: resolvedBusiness.address.state,
          addressCountry: 'IN',
        }
      : undefined,
    openingHours: Array.isArray(resolvedBusiness.hours)
      ? resolvedBusiness.hours.map((h) => h.replace(' — ', ''))
      : undefined,
    sameAs: resolvedBusiness.socials
      ? Object.values(resolvedBusiness.socials).filter((v) => typeof v === 'string' && v.startsWith('http'))
      : undefined,
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
              <ContactForm contactEmail={resolvedBusiness.email ?? ""} />
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
                    We welcome trade partnerships. Please include &quot;Wholesale&quot; in the subject and provide company credentials.
                  </div>
                </details>
              </div>
            </section>
          </div>

          {/* Right column — business info + social + map */}
          <aside className="space-y-6">
            <div className="card p-5">
              <h3 className="font-display text-lg">{resolvedBusiness.name ?? 'Pearl Bloom'}</h3>
              <div className="text-sm text-muted mt-2">
                {resolvedBusiness.address ? (
                  <>
                    {resolvedBusiness.address.line1 ? <div>{resolvedBusiness.address.line1}</div> : null}
                    {resolvedBusiness.address.line2 ? <div>{resolvedBusiness.address.line2}</div> : null}
                    {resolvedBusiness.address.postal ? <div>{resolvedBusiness.address.postal}</div> : null}
                  </>
                ) : (
                  <div>We’re available online across India.</div>
                )}
              </div>

              <div className="mt-4 text-sm">
                {resolvedBusiness.email ? (
                  <div><strong>Email:</strong> <a href={`mailto:${resolvedBusiness.email}`} className="underline">{resolvedBusiness.email}</a></div>
                ) : null}
                {resolvedBusiness.phone ? (
                  <div className="mt-2"><strong>Phone:</strong> <a href={`tel:${resolvedBusiness.phone}`} className="underline">{resolvedBusiness.phone}</a></div>
                ) : null}
                {!resolvedBusiness.email && !resolvedBusiness.phone ? (
                  <div className="text-muted">Use the form on the left or chat support.</div>
                ) : null}
              </div>

              {Array.isArray(resolvedBusiness.hours) && resolvedBusiness.hours.length ? (
                <div className="mt-4">
                  <div className="text-sm text-muted">Hours</div>
                  <ul className="mt-2 text-sm">
                    {resolvedBusiness.hours.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="card p-4">
              <h4 className="font-medium">Follow us</h4>
              <div className="flex gap-3 mt-3">
                {resolvedBusiness.socials?.instagram ? (
                  <a href={resolvedBusiness.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full w-10 h-10 flex items-center justify-center bg-white/6 hover:bg-white/8 transition">IG</a>
                ) : null}
                {resolvedBusiness.socials?.facebook ? (
                  <a href={resolvedBusiness.socials.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full w-10 h-10 flex items-center justify-center bg-white/6 hover:bg-white/8 transition">FB</a>
                ) : null}
                {resolvedBusiness.socials?.pinterest ? (
                  <a href={resolvedBusiness.socials.pinterest} target="_blank" rel="noreferrer" aria-label="Pinterest" className="rounded-full w-10 h-10 flex items-center justify-center bg-white/6 hover:bg-white/8 transition">PT</a>
                ) : null}
                {resolvedBusiness.socials?.whatsapp ? (
                  <a href={resolvedBusiness.socials.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-full w-10 h-10 flex items-center justify-center bg-white/6 hover:bg-white/8 transition">WA</a>
                ) : null}
              </div>
            </div>

            {resolvedBusiness.address ? (
              <div className="card p-0 overflow-hidden">
                <iframe
                  title="Store location"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    `${resolvedBusiness.address.line1 ?? ''} ${resolvedBusiness.address.line2 ?? ''} ${resolvedBusiness.address.city ?? ''} ${resolvedBusiness.address.state ?? ''} ${resolvedBusiness.address.postal ?? ''} India`
                  )}&output=embed`}
                  className="w-full h-48 border-0"
                  loading="lazy"
                />
              </div>
            ) : null}
          </aside>
        </div>
      </main>
    </>
  )
}
