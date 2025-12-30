// src/app/layout.tsx
import './globals.css'
import type { ReactNode } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChatWidget from '@/components/ChatWIdget'

// next/font/google (App Router friendly)
import { Playfair_Display, Inter } from 'next/font/google'
import SunriseOverlay from '../components/SunriseOverlay' // adjust path if needed
// instrumentation-client.js
import posthog from 'posthog-js'
import AuthProvider from '@/components/AuthProvider'
import CartDrawer from "@/components/CartDrawer";
import { ThemeApplier } from '@/components/ThemeApplier'
import Script from 'next/script'


if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2025-11-30'
  });
}
            

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

export const metadata = {
  title: 'Pearl Bloom — Exquisite Jewelry',
  description: 'jewelry — rings, necklaces, earrings. Luxury designs and timeless pieces.',
  icons: {
    icon: '/logo.svg',
  },
}




export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // apply both font variables on html so CSS can use them if needed
    <AuthProvider>
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[--background] text-[--foreground] font-sans">
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');
              `}
            </Script>
          </>
        )}
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
