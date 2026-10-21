import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Cursor } from '@/components/Cursor'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { RouteMemory } from '@/components/RouteMemory'
import { SelectionProvider } from '@/components/selection/SelectionProvider'
import { SelectionTray } from '@/components/selection/SelectionTray'
import { SiteSwitch } from '@/components/SiteSwitch'
import { DEMO_CONTACT } from '@/lib/copy'
import { isSite, singletonId, SITE_KEYS, SITES } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { SiteSettings } from '@/sanity/lib/types'
import { siteUrl } from '@/sanity/env'
import '@fontsource-variable/archivo/wdth.css'
import '../globals.css'

export const dynamicParams = false
export const generateStaticParams = () => SITE_KEYS.map((site) => ({ site }))

export async function generateMetadata({ params }: LayoutProps<'/[site]'>): Promise<Metadata> {
  const { site } = await params
  if (!isSite(site)) return {}
  const s = SITES[site]
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${s.brand} — Model Management`, template: `%s — ${s.brand}` },
    description: s.description,
    openGraph: { type: 'website', siteName: s.brand },
  }
}

export default async function SiteLayout({ children, params }: LayoutProps<'/[site]'>) {
  const { site } = await params
  if (!isSite(site)) notFound()
  const settings = await sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, { id: singletonId('siteSettings', site) }, null, ['siteSettings'])

  return (
    <html lang="en" data-theme={site === 'dot' ? 'dot' : undefined}>
      <body className="antialiased">
        <SelectionProvider site={site}>
          <Header site={site} />
          <main className="min-h-dvh">{children}</main>
          <Footer site={site} />
          <SiteSwitch site={site} />
          <SelectionTray site={site} email={settings?.email || DEMO_CONTACT.email} />
          <RouteMemory />
        </SelectionProvider>
        <Cursor />
      </body>
    </html>
  )
}
