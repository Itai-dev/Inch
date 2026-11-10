import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Cursor } from '@/components/Cursor'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { RouteMemory } from '@/components/RouteMemory'
import { SelectionProvider } from '@/components/selection/SelectionProvider'
import { SelectionTray } from '@/components/selection/SelectionTray'
import { SiteSwitch } from '@/components/SiteSwitch'
import { isSite, SITE_KEYS, SITES } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import { getSettings } from '@/sanity/lib/settings'
import { siteUrl } from '@/sanity/env'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/mrs-saint-delafield/400.css'
import '../globals.css'

export const dynamicParams = false
export const generateStaticParams = () => SITE_KEYS.map((site) => ({ site }))

export async function generateMetadata({ params }: LayoutProps<'/[site]'>): Promise<Metadata> {
  const { site } = await params
  if (!isSite(site)) return {}
  const s = SITES[site]
  // The Studio's own (Contact & settings › Google & sharing), else the site's.
  const { title, description, ogImage } = await getSettings(site)
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title || `${s.brand} — Model Management`, template: `%s — ${s.brand}` },
    description: description || s.description,
    openGraph: { type: 'website', siteName: s.brand, images: ogImage ? [{ url: urlFor(ogImage).width(1200).height(630).fit('crop').url(), width: 1200, height: 630 }] : undefined },
  }
}

/** Phones: the browser's own bars in the site's colour (white for INCH”, black for DOT.). */
export async function generateViewport({ params }: LayoutProps<'/[site]'>): Promise<Viewport> {
  const { site } = await params
  return { themeColor: site === 'dot' ? '#0a0a0a' : '#ffffff' }
}

export default async function SiteLayout({ children, params }: LayoutProps<'/[site]'>) {
  const { site } = await params
  if (!isSite(site)) notFound()
  const { contact } = await getSettings(site)

  return (
    <html lang="en" data-theme={site === 'dot' ? 'dot' : undefined}>
      <body className="antialiased">
        <SelectionProvider site={site}>
          <Header site={site} />
          <main className="min-h-dvh">{children}</main>
          <Footer site={site} />
          <SiteSwitch site={site} />
          <SelectionTray site={site} email={contact.email} />
          <RouteMemory />
        </SelectionProvider>
        <Cursor />
      </body>
    </html>
  )
}
