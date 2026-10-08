import Link from 'next/link'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { DotBox, Logo } from './brand/Logo'
import { SelectionCount } from './selection/SelectionCount'
import { NavLink } from './NavLink'
import { SiteSwitchLink } from './SiteSwitchLink'

/**
 * Header (Figma "INCH” Brand" › hero › artboard 36). Sizes are the 1920px artboard
 * scaled with the viewport: menu Archivo Bold caps / width 80 / -2% tracking at 0.8 × the
 * artboard's 32px, 57px from the top, 46px from the sides, menu top-aligned with the logo.
 * The other site's box (DOT. on INCH”, INCH” on DOT.) sits first, with even padding all round. Keep HEADER_* in QuoteVideoHero in sync.
 * No background: white + difference blend, so it inverts against whatever is behind it.
 */
export function Header({ site }: { site: Site }) {
  const s = SITES[site]
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 flex items-start justify-between px-gutter pb-4 pt-[clamp(16px,2.97vw,57px)] text-paper mix-blend-difference"
    >
      <Link href={sitePath(site)} aria-label={`${s.brand} home`}>
        <Logo division={s.division} className="text-[48px] md:text-[70px]" />
      </Link>
      <nav
        className="flex items-center gap-[var(--nav-gap)] text-[clamp(12px,1.333vw,25.6px)] font-bold uppercase leading-none [--nav-gap:1.65em]"
        style={{ fontStretch: '80%' }}
      >
        <NavLink href={sitePath(site, '/models')}>Models</NavLink>
        <NavLink href={sitePath(site, '/apply')} className="hidden md:inline">Apply</NavLink>
        <NavLink href={sitePath(site, '/contact')} className="hidden md:inline">Contact</NavLink>
        <SelectionCount />
        {/* The other site, as a box. White + difference blend: a black box on light pages, white on dark. */}
        {site === 'inch' ? (
          <SiteSwitchLink href={sitePath('dot')} toInch={false} label="DOT. — Men" className="site-switch order-first">
            <DotBox />
          </SiteSwitchLink>
        ) : (
          <SiteSwitchLink href={sitePath('inch')} toInch label="INCH” — Women" className="site-switch order-first flex items-center bg-paper pb-[0.16em] pl-[0.18em] pr-[0.16em] pt-[0.16em] text-ink">
            <Logo division="women" className="text-[1em] [&_svg]:!h-[0.74em]" />
          </SiteSwitchLink>
        )}
      </nav>
    </header>
  )
}
