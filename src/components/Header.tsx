import Link from 'next/link'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { Logo } from './brand/Logo'
import { SelectionCount } from './selection/SelectionCount'

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
      className="sticky top-0 z-40 flex items-start justify-between px-[clamp(20px,2.4vw,46px)] pb-4 pt-[clamp(16px,2.97vw,57px)] text-paper mix-blend-difference"
    >
      <Link href={sitePath(site)} aria-label={`${s.brand} home`}>
        <Logo division={s.division} className="text-[48px] md:text-[70px]" />
      </Link>
      <nav
        className="flex items-center gap-[var(--nav-gap)] text-[clamp(12px,1.333vw,25.6px)] font-bold uppercase leading-none tracking-[-0.02em] [--nav-gap:1.338em]"
        style={{ fontStretch: '80%' }}
      >
        <Link href={sitePath(site, '/models')}>Models</Link>
        <Link href={sitePath(site, '/apply')} className="hidden md:inline">Apply</Link>
        <Link href={sitePath(site, '/contact')} className="hidden md:inline">Contact</Link>
        <SelectionCount />
        {/* The other site, as a box. White + difference blend: a black box on light pages, white on dark. */}
        <Link
          href={site === 'inch' ? sitePath('dot') : sitePath('inch')}
          aria-label={site === 'inch' ? 'DOT. — Men' : 'INCH” — Women'}
          className={`order-first flex items-center bg-paper text-ink ${site === 'inch' ? 'pb-[0.11em] pl-[0.08em] pr-[0.12em] pt-[0.23em]' : 'pb-[0.18em] pl-[0.16em] pr-[0.16em] pt-[0.16em]'}`}
        >
          {site === 'inch' ? (
            <span className="block text-[1em] font-bold leading-[0.74] [font-stretch:100%]">
              DO<span className="tracking-[-0.1em]">T</span>.
            </span>
          ) : (
            <Logo division="women" className="text-[1em] [&_svg]:!h-[0.74em]" />
          )}
        </Link>
      </nav>
    </header>
  )
}
