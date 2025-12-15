'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'
import { dbClient } from '../libs/firebase-client'

type FooterLink = {
  label: string
  href: string
}

type SiteSettings = {
  siteName: string
  footer: {
    brandTitle: string
    brandDescription: string
    contactEmail: string
    contactPhone: string
    links?: FooterLink[]
  }
}

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      const ref = doc(dbClient, 'siteSettings', 'main')
      const snap = await getDoc(ref)

      if (snap.exists()) {
        setSettings(snap.data() as SiteSettings)
      }
    }

    fetchSettings()
  }, [])

  if (!settings) return null

  const { siteName, footer } = settings

  return (
    <footer className="border-t border-white/6 mt-16">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <h3 className="font-display text-xl">
            {footer.brandTitle}
          </h3>
          <p className="text-sm text-muted mt-3 max-w-sm">
            {footer.brandDescription}
          </p>
        </div>

        {/* Explore (CMS driven) */}
        <div>
          <h5 className="font-semibold">Explore</h5>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {footer.links?.length ? (
              footer.links.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="hover:text-yellow-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-neutral-500">No links configured</li>
            )}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h5 className="font-semibold">Contact</h5>
          <p className="text-sm text-muted mt-3">
            {footer.contactEmail}
            <br />
            {footer.contactPhone}
          </p>

          <div className="flex gap-3 mt-4">
            <a
              aria-label="Instagram"
              href="#"
              className="w-9 h-9 rounded-full bg-white/4 flex items-center justify-center hover:bg-white/10 transition"
            >
              ig
            </a>
            <a
              aria-label="Pinterest"
              href="#"
              className="w-9 h-9 rounded-full bg-white/4 flex items-center justify-center hover:bg-white/10 transition"
            >
              pt
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/4 py-6 text-center text-sm text-muted">
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </div>
    </footer>
  )
}
