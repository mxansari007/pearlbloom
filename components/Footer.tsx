'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'
import { dbClient } from '../libs/firebase-client'
import { CreditCard, Instagram, Landmark, ShieldCheck, Smartphone, Twitter, Wallet, Facebook, Linkedin } from 'lucide-react';



type FooterLink = {
  label: string
  href: string
}

type SocialLink = {
  platform: "instagram" | "facebook" | "twitter" | "youtube" | "linkedin" | "whatsapp";
  url: string;
};


type SiteSettings = {
  siteName: string
  footer: {
    brandTitle: string
    brandDescription: string
    contactEmail: string
    contactPhone: string
    links?: FooterLink[]
    socialLinks: SocialLink[]
  }
}

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const defaultLinks: FooterLink[] = [
    { label: 'Products', href: '/products' },
    { label: 'Contact', href: '/contact' },
    { label: 'Shipping & Delivery', href: '/shipping-and-delivery' },
    { label: 'Returns & Refunds', href: '/returns-and-refunds' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Warranty & Care', href: '/warranty-and-care' },
  ]

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

  const siteName = settings?.siteName ?? 'Pearl Bloom'
  const footer = settings?.footer ?? {
    brandTitle: 'Pearl Bloom',
    brandDescription: 'Exquisite jewelry designed for everyday elegance.',
    contactEmail: '',
    contactPhone: '',
    links: [],
    socialLinks: [],
  }

  const mergedLinks = (() => {
    const cms = Array.isArray(footer.links) ? footer.links : []
    const all = [...cms, ...defaultLinks]
    const seen = new Set<string>()
    return all.filter((l) => {
      const key = `${l.label}::${l.href}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })()

  const buildWhatsAppHref = (input: string, message: string) => {
    const v = input.trim()
    if (!v) return null

    if (v.startsWith('http://') || v.startsWith('https://')) {
      try {
        const url = new URL(v)
        if (!url.searchParams.has('text')) url.searchParams.set('text', message)
        return url.toString()
      } catch {
        return v
      }
    }

    let digits = v.replace(/[^\d]/g, '')
    if (!digits) return null
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
    if (digits.length === 10) digits = `91${digits}`
    if (digits.length < 10) return null
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
  }

  const whatsappHref = (() => {
    const message = 'Hi Pearl Bloom, I need help with an order.'
    const wa = footer.socialLinks?.find((l) => l.platform === 'whatsapp')?.url
    if (wa && wa.trim()) {
      const href = buildWhatsAppHref(wa, message)
      if (href) return href
    }
    if (!footer.contactPhone) return null
    return buildWhatsAppHref(String(footer.contactPhone), message)
  })()

  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--footer-border)' }}>
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
            {mergedLinks.map((link, idx) => (
              <li key={`${link.href}-${idx}`}>
                <Link
                  href={link.href}
                  className="hover:text-yellow-400 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h5 className="font-semibold">Contact</h5>
          <p className="text-sm text-muted mt-3">
            {footer.contactEmail ? (
              <>
                <a href={`mailto:${footer.contactEmail}`} className="underline underline-offset-2">
                  {footer.contactEmail}
                </a>
                <br />
              </>
            ) : null}
            {
              <Link href="/contact" className="underline underline-offset-2">
                Contact support
              </Link>
            }
          </p>

          <div className="flex gap-3 mt-4">
            {footer.socialLinks?.find(link => link.platform === 'instagram') && <a
              aria-label="Instagram"
              href={footer.socialLinks.find(link => link.platform === 'instagram')?.url || '#'}
              className="w-9 h-9 rounded-full btn-glass flex items-center justify-center transition"
            >
              <Instagram size={16} />
            </a>}
            {footer.socialLinks?.find(link => link.platform === 'facebook') && <a
              aria-label="Facebook"
              href={footer.socialLinks.find(link => link.platform === 'facebook')?.url || '#'}
              className="w-9 h-9 rounded-full btn-glass flex items-center justify-center transition"
            >
              <Facebook size={16} />
            </a>}
            {footer.socialLinks?.find(link => link.platform === 'twitter') && <a
              aria-label="Twitter"
              href={footer.socialLinks.find(link => link.platform === 'twitter')?.url || '#'}
              className="w-9 h-9 rounded-full btn-glass flex items-center justify-center transition"
            >
              <Twitter size={16} />
            </a>}
            {footer.socialLinks?.find(link => link.platform === 'linkedin') && <a
              aria-label="LinkedIn"
              href={footer.socialLinks.find(link => link.platform === 'linkedin')?.url || '#'}
              className="w-9 h-9 rounded-full btn-glass flex items-center justify-center transition"
            >
              <Linkedin size={16} />
            </a>}
            {whatsappHref && (
              <a
                aria-label="WhatsApp"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full btn-glass flex items-center justify-center transition text-xs font-semibold"
              >
                WA
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container pb-10">
        <div
          className="rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4"
          style={{
            background: "rgba(var(--gold-rgb),0.08)",
            border: "1px solid rgba(var(--gold-rgb),0.18)",
          }}
        >
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck size={16} className="text-[rgb(var(--gold-rgb))]" />
            <span className="font-medium">Secure payments via Razorpay</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
            <span className="inline-flex items-center gap-1.5">
              <Smartphone size={14} />
              UPI
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CreditCard size={14} />
              Cards
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Landmark size={14} />
              Netbanking
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet size={14} />
              Wallets
            </span>
          </div>
        </div>
      </div>

      <div className="border-t py-6 text-center text-sm text-muted" style={{ borderColor: 'var(--footer-border)' }}>
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </div>
    </footer>
  )
}
