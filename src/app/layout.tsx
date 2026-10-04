import type { Metadata } from 'next'
import { siteUrl } from '@/sanity/env'
import '@fontsource-variable/archivo/wdth.css'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'INCH” — Model Management', template: '%s — INCH”' },
  description:
    'Inch is a boutique modeling agency representing distinctive talent, curated with a precise eye for fashion and image.',
  openGraph: { type: 'website', siteName: 'INCH”' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
