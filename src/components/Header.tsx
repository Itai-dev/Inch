import Link from 'next/link'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { Logo } from './brand/Logo'
import { SelectionCount } from './selection/SelectionCount'

export function Header({ site }: { site: Site }) {
  const s = SITES[site]
  return (
    // No background: white + difference blend, so the logo and menu invert against whatever is behind them.
    <header data-site-header className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 text-paper mix-blend-difference md:px-10">
      <Link href={sitePath(site)} aria-label={`${s.brand} home`}>
        <Logo division={s.division} className="text-[48px] md:text-[70px]" />
      </Link>
      <nav className="label flex items-center gap-5 md:gap-8">
        <Link href={sitePath(site, '/models')}>Models</Link>
        <Link href={sitePath(site, '/apply')} className="hidden md:inline">Become a model</Link>
        <Link href={sitePath(site, '/contact')} className="hidden md:inline">Contact</Link>
        <SelectionCount />
        {site === 'inch' && (
          <Link href={sitePath('dot')} aria-label="DOT. — Men" className="bg-paper px-2 py-1 text-ink">
            <Logo division="men" className="text-base" />
          </Link>
        )}
      </nav>
    </header>
  )
}
