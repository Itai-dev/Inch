import Link from 'next/link'
import { singletonId, sitePath, SITES, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { SiteSettings } from '@/sanity/lib/types'
import { Logo } from './brand/Logo'
import { Pattern } from './brand/Pattern'

export async function Footer({ site }: { site: Site }) {
  const s = SITES[site]
  const other: Site = site === 'dot' ? 'inch' : 'dot'
  const settings = await sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, { id: singletonId('siteSettings', site) }, null, ['siteSettings'])

  return (
    <footer className="mt-24 flex flex-col gap-12 px-gutter pb-10 pt-16">
      <Pattern variant={site} className="hidden text-fg md:grid" rows={2} cols={16} />
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <Logo division={s.division} className="text-5xl" />
        <nav className="label flex flex-wrap gap-6 text-muted">
          <Link href={sitePath(site, '/apply')}>Become a model</Link>
          <Link href={sitePath(site, '/contact')}>Contact</Link>
          {settings?.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a>}
          <Link href={sitePath(site, '/privacy')}>Privacy</Link>
          <Link href={sitePath(site, '/accessibility')}>Accessibility</Link>
          <Link href={sitePath(other)}>{SITES[other].brand} {SITES[other].label} →</Link>
          <span>© {new Date().getFullYear()} {s.brand}</span>
        </nav>
      </div>
    </footer>
  )
}
