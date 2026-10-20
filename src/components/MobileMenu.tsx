'use client'

/**
 * The menu on phones: a MENU word in the header (and the selection, once there is one) opens the
 * whole menu over the page, black, the links large and typing in one after another as the
 * header's do; below them the other site's box and how to reach the agency. Closes with the
 * button, Escape or any link.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { DotBox, Logo } from './brand/Logo'
import { NavLabel } from './NavLabel'
import { useSelection } from './selection/SelectionProvider'
import { SiteSwitchLink } from './SiteSwitchLink'

const narrow = { fontStretch: '80%' } as const

export function MobileMenu({ site, email, instagram }: { site: Site; email: string; instagram: string }) {
  const [open, setOpen] = useState(false)
  const { items, setOpen: openSelection } = useSelection()
  const path = usePathname().replace(/^\/inch(?=\/|$)/, '') || '/'
  const s = SITES[site]
  const other: Site = site === 'dot' ? 'inch' : 'dot'

  // While open: no scrolling behind, and Escape closes.
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const was = root.style.overflow
    root.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = was
      removeEventListener('keydown', onKey)
    }
  }, [open])

  const links = [
    { text: 'Models', href: sitePath(site, '/models') },
    { text: 'Apply', href: sitePath(site, '/apply') },
    { text: 'Contact', href: sitePath(site, '/contact') },
  ]
  const type = (k: number) => ({ animation: `hero-type 0.45s steps(6) ${120 + k * 70}ms both` })

  return (
    <>
      {items.length > 0 && (
        <button type="button" onClick={() => openSelection(true)} className="nav-item uppercase md:hidden" aria-label="Open selection">
          <NavLabel>Selection ({items.length})</NavLabel>
        </button>
      )}
      <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-haspopup="dialog" className="nav-item -my-3 py-3 uppercase md:hidden">
        <NavLabel>Menu</NavLabel>
      </button>

      {open &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label="Menu" className="mobile-menu fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-ink text-paper md:hidden">
            {/* The header's own row: the logo where it was, and close where MENU was. */}
            <div className="flex shrink-0 items-center justify-between px-gutter pb-4 pt-[clamp(12px,2.1vw,40px)]">
              <Link href={sitePath(site)} onClick={() => setOpen(false)} aria-label={`${s.brand} home`}>
                <Logo division={s.division} className="text-[48px]" />
              </Link>
              <button type="button" onClick={() => setOpen(false)} className="-my-3 py-3 text-[clamp(12px,3.4vw,15px)] font-bold uppercase leading-none" style={narrow}>
                Close
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-[clamp(4px,1.2vh,12px)] px-gutter py-10" aria-label="Main">
              {links.map((l, k) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={path === l.href || path.startsWith(`${l.href}/`) ? 'page' : undefined}
                  className="wordmark self-start text-[clamp(52px,16vw,88px)] uppercase leading-[0.95] aria-[current=page]:opacity-40"
                  style={type(k)}
                >
                  {l.text}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  openSelection(true)
                }}
                className="wordmark self-start text-left text-[clamp(52px,16vw,88px)] uppercase leading-[0.95]"
                style={type(links.length)}
              >
                Selection<sup className="ml-[0.08em] align-[0.9em] text-[0.36em] tabular-nums">({items.length})</sup>
              </button>
            </nav>

            {/* The other site, and how to reach the agency. */}
            <div className="flex shrink-0 flex-col gap-6 px-gutter pb-[max(28px,env(safe-area-inset-bottom))]" style={type(links.length + 1)}>
              <SiteSwitchLink href={sitePath(other)} toInch={other === 'inch'} label={`${SITES[other].brand} — ${SITES[other].label}`} className="flex items-center gap-3 self-start text-[26px]">
                {other === 'dot' ? (
                  <DotBox />
                ) : (
                  <span className="flex items-center bg-paper pb-[0.16em] pl-[0.18em] pr-[0.16em] pt-[0.16em] text-ink">
                    <Logo division="women" className="text-[1em] [&_svg]:!h-[0.74em]" />
                  </span>
                )}
                <span className="text-[15px] font-bold uppercase" style={narrow}>
                  {SITES[other].label}
                </span>
              </SiteSwitchLink>
              <div className="flex flex-col gap-1 text-[16px]">
                <a href={`mailto:${email}`} className="font-bold">{email}</a>
                <a href={instagram} target="_blank" rel="noreferrer" className="text-paper/60">
                  {instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}
                </a>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
