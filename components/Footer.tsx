'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'
import Image from 'next/image'
import { dbClient } from '../libs/firebase-client'
import { 
  CreditCard, 
  Instagram, 
  Landmark, 
  ShieldCheck, 
  Smartphone, 
  Twitter, 
  Wallet, 
  Facebook, 
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
  Sparkles,
  
} from 'lucide-react';

import {FaWhatsapp} from 'react-icons/fa';

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

const socialIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
};

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  
  const defaultLinks: FooterLink[] = [
    { label: 'All Earrings', href: '/earrings' },
    { label: 'Journal', href: '/blog' },
    { label: 'Contact', href: '/contact' },
    { label: 'Shipping & Delivery', href: '/shipping-and-delivery' },
    { label: 'Returns & Refunds', href: '/returns-and-refunds' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
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
  // Always show a working contact email in the footer (falls back to the brand inbox).
  const contactEmail = settings?.footer?.contactEmail?.trim() || 'info@pearlbloom.in'
  const footer = settings?.footer ?? {
    brandTitle: 'Pearl Bloom',
    brandDescription: 'Skin-safe, anti-tarnish artificial earrings for every day — gold-tone shine, honestly priced.',
    contactEmail: '',
    contactPhone: '',
    links: [],
    socialLinks: [],
  }

  const mergedLinks = (() => {
    const cms = Array.isArray(footer.links) ? footer.links : []
    // Normalise the legacy "/products" catalog link (from code or saved settings)
    // to the redesigned "/earrings" catalog.
    const all = [...cms, ...defaultLinks].map((l) =>
      l.href === '/products'
        ? { ...l, href: '/earrings', label: l.label === 'Products' ? 'All Earrings' : l.label }
        : l
    )
    const seen = new Set<string>()
    return all.filter((l) => {
      if (seen.has(l.href)) return false // dedupe by destination
      seen.add(l.href)
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

  // The whole footer becomes a deep, on-brand maroon gradient. We redefine the
  // theme colour variables *within* the footer so every descendant that reads
  // var(--fg)/var(--muted)/etc. automatically turns light & readable on the dark
  // background — in both light and dark site themes. --gold-rgb is left intact so
  // the gold accents keep glowing.
  const footerStyle: Record<string, string> = {
    background:
      // Upper part fades from the light page background (above the footer) down into
      // deep maroon — matching the newsletter card — and is fully maroon by ~33%,
      // before the text columns (which sit ~40%+ down) so they stay readable.
      "linear-gradient(180deg, #fafafa 0%, #f3dde2 10%, #b56a78 20%, #4f1322 33%, #5a1626 62%, #74203a 100%)",
    color: "#fdeee9",
    "--fg": "#fdeee9",
    "--muted": "rgba(253, 238, 233, 0.62)",
    "--footer-border": "rgba(255, 255, 255, 0.12)",
    "--input-bg": "rgba(255, 255, 255, 0.07)",
    "--input-border": "rgba(255, 255, 255, 0.18)",
    "--input-text": "#ffffff",
  }

  return (
    <footer
      className="relative overflow-hidden mt-20"
      style={footerStyle as CSSProperties}
    >
      {/* Decorative glows layered over the gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] opacity-40"
          style={{
            background: "radial-gradient(ellipse, rgba(var(--gold-rgb), 0.22), transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-[420px] h-[420px] opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(216, 63, 89, 0.45), transparent 70%)",
          }}
        />
        <div
          className="absolute -top-16 -right-16 w-[360px] h-[360px] opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(var(--gold-rgb), 0.3), transparent 70%)",
          }}
        />
      </div>

      {/* Newsletter Section */}
      <div className="container relative z-10 pb-16">
        <div
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center flex flex-col items-center"
          style={{
            // A distinct, premium panel that stands apart from the maroon footer:
            // a deep wine-to-plum gradient with a warm gold inner glow and a thin
            // gold ring. Light ivory copy + a gold eyebrow keep it elegant and
            // highly readable (no more muddy light→maroon blend with the page).
            background:
              "radial-gradient(120% 140% at 50% 0%, rgba(214,170,68,0.20) 0%, rgba(214,170,68,0) 45%), linear-gradient(160deg, #5e1830 0%, #3d0f1a 55%, #2c0a14 100%)",
            border: "1px solid rgba(214,170,68,0.38)",
            boxShadow:
              "0 30px 70px -32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Soft gold halo behind the heading */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[300px] pointer-events-none opacity-60"
            style={{
              background:
                "radial-gradient(ellipse, rgba(214,170,68,0.22), transparent 70%)",
            }}
          />
          <div
            className="relative z-10 inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full"
            style={{
              background: "rgba(214,170,68,0.14)",
              border: "1px solid rgba(214,170,68,0.32)",
            }}
          >
            <Sparkles size={16} className="text-amber-300" />
            <span className="text-xs uppercase tracking-widest font-semibold text-amber-200">
              Stay Connected
            </span>
          </div>
          <h3 className="relative z-10 text-2xl md:text-3xl font-display mb-3" style={{ color: "#fdeee9" }}>
            Join Our Inner Circle
          </h3>
          <p className="relative z-10 text-sm max-w-md mx-auto mb-6" style={{ color: "rgba(253, 238, 233, 0.78)" }}>
            Be the first to know about new arrivals, exclusive offers, and styling tips.
          </p>
          <form className="relative z-10 flex flex-col sm:flex-row gap-3 max-w-md w-full">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-amber-400/40"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                color: "#ffffff",
              }}
            />
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, rgb(var(--gold-rgb)), #e6c547)",
                color: "#000",
              }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer */}
      <div 
        className="relative z-10 border-t"
        style={{ borderColor: "var(--footer-border)" }}
      >
        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, rgba(var(--gold-rgb), 0.2), rgba(var(--gold-rgb), 0.05))",
                    border: "1px solid rgba(var(--gold-rgb), 0.2)",
                  }}
                >
                  <Image 
                    src="/logo.svg" 
                    alt="Pearl Bloom" 
                    width={24} 
                    height={24}
                  />
                </div>
                <span className="text-xl font-display" style={{ color: "#fdeee9" }}>{footer.brandTitle}</span>
              </Link>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted)" }}>
                {footer.brandDescription}
              </p>
              
              {/* Social Links */}
              <div className="flex gap-2">
                {footer.socialLinks?.filter(l => l.platform !== 'whatsapp' && l.url).map((link) => {
                  const Icon = socialIcons[link.platform];
                  if (!Icon) return null;
                  return (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.platform}
                      className="footer-social w-10 h-10 rounded-xl flex items-center justify-center"
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
                    style={{
                      background: "rgba(37, 211, 102, 0.1)",
                      border: "1px solid rgba(37, 211, 102, 0.2)",
                      color: "#25D366",
                    }}
                  >
                    <FaWhatsapp size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: "var(--muted)" }}>
                Quick Links
              </h4>
              <ul className="space-y-3">
                {mergedLinks.slice(0, 7).map((link, idx) => (
                  <li key={`${link.href}-${idx}`}>
                    <Link
                      href={link.href}
                      className="footer-link group inline-flex items-center gap-1 text-sm"
                    >
                      {link.label}
                      <ArrowUpRight size={12} className="opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: "var(--muted)" }}>
                Customer Service
              </h4>
              <ul className="space-y-3">
                {[
                  { label: "Track Order", href: "/orders" },
                  { label: "Returns & Exchanges", href: "/returns-and-refunds" },
                  { label: "Warranty & Care", href: "/warranty-and-care" },
                  { label: "FAQs", href: "/contact" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="footer-link group inline-flex items-center gap-1 text-sm"
                    >
                      {link.label}
                      <ArrowUpRight size={12} className="opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: "var(--muted)" }}>
                Get in Touch
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(var(--gold-rgb), 0.1)",
                      border: "1px solid rgba(var(--gold-rgb), 0.15)",
                    }}
                  >
                    <Mail size={14} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Email us</p>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-sm hover:text-amber-400 transition-colors"
                    >
                      {contactEmail}
                    </a>
                  </div>
                </li>
                {footer.contactPhone && (
                  <li className="flex items-start gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: "rgba(var(--gold-rgb), 0.1)",
                        border: "1px solid rgba(var(--gold-rgb), 0.15)",
                      }}
                    >
                      <Phone size={14} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Call us</p>
                      <a 
                        href={`tel:${footer.contactPhone}`}
                        className="text-sm hover:text-amber-400 transition-colors"
                      >
                        {footer.contactPhone}
                      </a>
                    </div>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(var(--gold-rgb), 0.1)",
                      border: "1px solid rgba(var(--gold-rgb), 0.15)",
                    }}
                  >
                    <MapPin size={14} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Visit us</p>
                    <p className="text-sm">India</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Methods & Security */}
        <div className="container pb-8">
          <div 
            className="rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{
              background: "rgba(var(--gold-rgb), 0.06)",
              border: "1px solid rgba(var(--gold-rgb), 0.12)",
            }}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-amber-400" />
              <span className="text-sm font-medium">100% Secure Payments via Razorpay</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
              {[
                { icon: Smartphone, label: "UPI" },
                { icon: CreditCard, label: "Cards" },
                { icon: Landmark, label: "Netbanking" },
                { icon: Wallet, label: "Wallets" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Icon size={14} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="border-t py-6"
          style={{ borderColor: "var(--footer-border)" }}
        >
          <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: "var(--muted)" }}>
            <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy-policy" className="hover:text-amber-400 transition-colors">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="hover:text-amber-400 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
