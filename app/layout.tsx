// src/app/layout.tsx
import './globals.css'
import { Suspense, type ReactNode } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChatWidget from '@/components/ChatWIdget'

// next/font/google (App Router friendly)
import { Playfair_Display, Inter } from 'next/font/google'
import SunriseOverlay from '../components/SunriseOverlay' // adjust path if needed
import AuthProvider from '@/components/AuthProvider'
import CartDrawer from "@/components/CartDrawer";
import { ThemeApplier } from '@/components/ThemeApplier'
import Script from 'next/script'
import PostHogClient from '@/components/PostHogClient'
import FacebookPixel from '@/components/FacebookPixel'

// load Playfair Display for headings (Display) and Inter for body.
// adjust weights if you need more/less variants.
const playfair = Playfair_Display({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})
const inter = Inter({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://pearlbloom.in'

export const metadata = {
  metadataBase: new URL(SITE),
  title: 'Pearl Bloom — Affordable Anti-Tarnish Earrings for Women',
  description:
    'Pearl Bloom — affordable, anti-tarnish, skin-safe artificial earrings for women. Shop studs, hoops, jhumkas and more for daily, office, party and bridal wear.',
  keywords: ['artificial earrings', 'anti-tarnish earrings', 'earrings for women', 'gold-plated earrings', 'jhumka earrings', 'Pearl Bloom'],
  applicationName: 'Pearl Bloom',
  icons: {
    icon: '/logo.svg',
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Pearl Bloom',
    locale: 'en_IN',
    title: 'Pearl Bloom — Affordable Anti-Tarnish Earrings for Women',
    description:
      'Affordable, anti-tarnish, skin-safe artificial earrings for women — studs, hoops, jhumkas and more.',
    images: [{ url: '/earring.png', width: 665, height: 597, alt: 'Pearl Bloom artificial earrings' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pearl Bloom — Affordable Anti-Tarnish Earrings for Women',
    description: 'Affordable, anti-tarnish, skin-safe artificial earrings for women.',
    images: ['/earring.png'],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#5b1a23',
}




export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // apply both font variables on html so CSS can use them if needed
    <AuthProvider>
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://pearlboom-74976.firebaseapp.com" />
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
        {/* Sitewide Organization + WebSite structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Pearl Bloom",
                url: SITE,
                logo: `${SITE}/logo.svg`,
                description:
                  "Affordable anti-tarnish, skin-safe artificial earrings for women in India.",
                email: "info@pearlbloom.in",
                contactPoint: {
                  "@type": "ContactPoint",
                  email: "info@pearlbloom.in",
                  contactType: "customer service",
                  areaServed: "IN",
                  availableLanguage: ["en", "hi"],
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Pearl Bloom",
                url: SITE,
              },
            ]),
          }}
        />
      </head>
      <body className="min-h-screen bg-[--background] text-[--foreground] font-sans">
        <FacebookPixel />
        <Suspense fallback={null}>
          <PostHogClient />
        </Suspense>

      
        <ThemeApplier />
        <Header />

        <main>{children}</main>
        <CartDrawer />
        <ChatWidget />
        <Footer />
      </body>
    </html>
    </AuthProvider>
  )
}
