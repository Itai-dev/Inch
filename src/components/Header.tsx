import Link from 'next/link'
import { DEMO_CONTACT } from '@/lib/copy'
import { singletonId, sitePath, SITES, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { SiteSettings } from '@/sanity/lib/types'
import { Logo } from './brand/Logo'
import { MobileMenu } from './MobileMenu'
import { SelectionCount } from './selection/SelectionCount'
import { NavLink } from './NavLink'

/**
 * Header (Figma "INCH” Brand" › hero › artboard 36). Sizes are the 1920px artboard
 * scaled with the viewport: menu Archivo Bold caps / width 80 / -2% tracking at 0.8 × the
 * artboard's 32px, 40px from the top, 46px from the sides, menu top-aligned with the logo.
 * The other site's box lives at the right edge instead (SiteSwitch). Keep HEADER_* in QuoteVideoHero in sync.
 * No background: white + difference blend, so it inverts against whatever is behind it.
 * On phones the links fold into MENU (MobileMenu).
 */
export async function Header({ site }: { site: Site }) {
  const s = SITES[site]
  const settings = await sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, { id: singletonId('siteSettings', site) }, null, ['siteSettings'])
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 flex items-center justify-between px-gutter pb-4 pt-[clamp(12px,2.1vw,40px)] text-paper mix-blend-difference"
    >
      <Link href={sitePath(site)} aria-label={`${s.brand} home`}>
        <Logo division={s.division} className="text-[48px] md:text-[70px]" />
      </Link>
      <nav
        className="flex items-center gap-[var(--nav-gap)] text-[clamp(13px,3.4vw,15px)] font-bold md:text-[clamp(12px,1.333vw,25.6px)] uppercase leading-none [--nav-gap:1.65em]"
        style={{ fontStretch: '80%' }}
      >
        <NavLink href={sitePath(site, '/models')} className="hidden md:inline">Models</NavLink>
        <NavLink href={sitePath(site, '/apply')} className="hidden md:inline">Apply</NavLink>
        <NavLink href={sitePath(site, '/contact')} className="hidden md:inline">Contact</NavLink>
        <SelectionCount className="hidden md:inline" />
        <MobileMenu site={site} email={settings?.email || DEMO_CONTACT.email} instagram={settings?.instagram || DEMO_CONTACT.instagram} />
      </nav>
    </header>
  )
}
