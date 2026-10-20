'use client'

/**
 * The other site's box (DOT. on INCH”, INCH” on DOT.), upright in the bottom-left corner. It pops
 * up once the home page's video has scrolled away (straight away on other pages), and goes again
 * when the footer arrives (the footer carries its own). White + difference blend like the header,
 * so it inverts against whatever is behind it. Not on phones, where it would sit over the page:
 * there it is in the menu (MobileMenu).
 */
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { sitePath, type Site } from '@/lib/sites'
import { DotBox, Logo } from './brand/Logo'
import { SiteSwitchLink } from './SiteSwitchLink'

export function SiteSwitch({ site }: { site: Site }) {
  const toInch = site === 'dot'
  const box = useRef<HTMLDivElement>(null)
  const path = usePathname()

  useEffect(() => {
    const el = box.current
    if (!el) return
    const read = () => {
      const hero = document.querySelector('[data-hero]')
      const footer = document.querySelector('body footer')
      const past = !hero || hero.getBoundingClientRect().bottom < innerHeight * 0.2
      const atFooter = !!footer && footer.getBoundingClientRect().top < innerHeight - 24
      el.toggleAttribute('data-shown', past && !atFooter)
    }
    read()
    addEventListener('scroll', read, { passive: true })
    addEventListener('resize', read)
    return () => {
      removeEventListener('scroll', read)
      removeEventListener('resize', read)
    }
  }, [path])

  return (
    // On DOT. the way back to INCH” is the larger of the two: INCH” is the house.
    <div ref={box} className={`site-switch-tab hidden text-paper mix-blend-difference md:block ${toInch ? 'site-switch-tab--lead' : ''}`}>
      <SiteSwitchLink href={sitePath(toInch ? 'inch' : 'dot')} toInch={toInch} label={toInch ? 'INCH” — Women' : 'DOT. — Men'} className="flex flex-col items-start gap-[0.45em]">
        {/* Who it is for, above the box. */}
        <span className="site-switch-for font-bold uppercase leading-none tracking-[0.04em]" style={{ fontStretch: '80%' }}>
          {toInch ? 'For women' : 'For men'}
        </span>
        <span className="site-switch block origin-bottom-left text-[length:var(--tab)]">
          {toInch ? (
            <span className="flex items-center bg-paper pb-[0.16em] pl-[0.18em] pr-[0.16em] pt-[0.16em] text-ink">
              <Logo division="women" className="text-[1em] [&_svg]:!h-[0.74em]" />
            </span>
          ) : (
            <DotBox />
          )}
        </span>
      </SiteSwitchLink>
    </div>
  )
}
