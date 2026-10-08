import Link from 'next/link'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { Logo } from './brand/Logo'
import { SelectionCount } from './selection/SelectionCount'

/**
 * Header (Figma "INCH” Brand" › hero › artboard 36). Sizes are the 1920px artboard
 * scaled with the viewport: menu Archivo Bold 32px caps / width 80 / -2% tracking,
 * 57px from the top, 46px from the sides, menu top-aligned with the logo. Keep HEADER_* in QuoteVideoHero in sync.
 * No background: white + difference blend, so it inverts against whatever is behind it.
 */
export function Header({ site }: { site: Site }) {
  const s = SITES[site]
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 flex items-start justify-between px-[clamp(20px,2.4vw,46px)] pb-4 pt-[clamp(16px,2.97vw,57px)] text-paper mix-blend-difference"
    >
      <Link href={sitePath(site)} aria-label={`${s.brand} home`}>
        <Logo division={s.division} className="text-[48px] md:text-[70px]" />
      </Link>
      <nav
        className="flex items-center gap-[var(--nav-gap)] text-[clamp(13px,1.667vw,32px)] font-bold uppercase leading-none tracking-[-0.02em] [--nav-gap:1.32em]"
        style={{ fontStretch: '80%' }}
      >
        <Link href={sitePath(site, '/models')}>Models</Link>
        <Link href={sitePath(site, '/apply')} className="hidden md:inline">Apply</Link>
        <Link href={sitePath(site, '/contact')} className="hidden md:inline">Contact</Link>
        <SelectionCount />
        {site === 'inch' && (
          // White box: blends to a black box with white type on light pages.
          <Link href={sitePath('dot')} aria-label="DOT. — Men" className="order-first flex h-[1.09em] w-[2.66em] items-center justify-center bg-paper text-ink">
            <Logo division="men" className="text-[1em]" />
          </Link>
        )}
      </nav>
    </header>
  )
}
