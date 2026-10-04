import type { Metadata } from 'next'
import { siteUrl } from '@/sanity/env'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'INCH” — Model Management', template: '%s — INCH”' },
  description: 'INCH” model management. Women and DOT. men.',
  openGraph: { type: 'website', siteName: 'INCH”' },
}

// Brand typefaces get added with next/font/local once the type system is approved.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
