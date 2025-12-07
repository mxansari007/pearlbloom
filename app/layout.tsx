// src/app/layout.tsx
import './globals.css'
import type { ReactNode } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

// next/font/google (App Router friendly)
import { Playfair_Display, Inter } from 'next/font/google'

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
  title: 'Aurum Jewelers — Exquisite Jewelry',
  description: 'Handcrafted jewelry — rings, necklaces, earrings. Luxury designs and timeless pieces.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // apply both font variables on html so CSS can use them if needed
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[--background] text-[--foreground] font-sans">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
