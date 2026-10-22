'use client'

/**
 * The other site's box. INCH”: DOT.'s, in the bottom-left corner (SiteSwitch). DOT.: INCH”'s, in the
 * header (Header). On phones both are in the menu (MobileMenu).
 */
import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { sitePath, type Site } from '@/lib/sites'
import { DotBox } from './brand/Logo'
import { SiteSwitchLink } from './SiteSwitchLink'

/** A label line sized to be exactly as wide as a box: returns refs for the two (refit while `active` changes). */
export function useFitWidth<L extends HTMLElement, B extends HTMLElement>(active: unknown = true) {
  const label = useRef<L>(null)
  const box = useRef<B>(null)
  useLayoutEffect(() => {
    const l = label.current
    const b = box.current
    if (!l || !b) return
    const fit = () => {
      l.style.fontSize = '12px'
      const lw = l.scrollWidth
      if (lw && b.offsetWidth) l.style.fontSize = `${(12 * b.offsetWidth) / lw}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(b)
    return () => ro.disconnect()
  }, [active])
  return [label, box] as const
}

/**
 * INCH” only: DOT.'s box in the bottom-left corner, "For men:" above it, as wide as the box. It
 * pops up once the home page's video has scrolled away (straight away on other pages), and goes
 * again when the footer arrives. (On DOT. the way back to INCH” is in the header.) White +
 * difference blend like the header, so it inverts against whatever is behind it. Not on phones,
 * where it is in the menu.
 */
export function SiteSwitch({ site }: { site: Site }) {
  const box = useRef<HTMLDivElement>(null)
  const [label, dot] = useFitWidth<HTMLSpanElement, HTMLSpanElement>()
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

  if (site === 'dot') return null
  return (
    <div ref={box} className="site-switch-tab hidden text-paper mix-blend-difference md:block">
      <SiteSwitchLink href={sitePath('dot')} toInch={false} label="DOT. — Men" className="flex flex-col items-start gap-[0.4em]">
        <span ref={label} className="whitespace-nowrap font-bold uppercase leading-none" style={{ fontStretch: '80%' }}>
          For men:
        </span>
        <span ref={dot} className="site-switch block origin-bottom-left text-[length:var(--tab)]">
          <DotBox />
        </span>
      </SiteSwitchLink>
    </div>
  )
}
