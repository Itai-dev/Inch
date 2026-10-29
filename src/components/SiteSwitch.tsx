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

/** Only these INCH” pages carry the tab (/logotest is the home page too). */
const TAB_PAGES = ['/', '/contact', '/logotest']

/**
 * INCH” only, on the home and contact pages: DOT.'s box in the bottom-left corner, "Men division"
 * above it, as wide as the box. On the home page it pops up as soon as the video has opened, standing
 * just above the hero's ruler (level with the sound switch on the right), and drops to the corner
 * once the ruler fades away. It goes again when the footer arrives. (On DOT. the way back to INCH”
 * is in the header.) White + difference blend like the header, so it inverts against whatever is
 * behind it. Not on phones, where it is in the menu.
 */
export function SiteSwitch({ site }: { site: Site }) {
  const box = useRef<HTMLDivElement>(null)
  const path = usePathname().replace(/^\/inch(?=\/|$)/, '') || '/'
  const [label, dot] = useFitWidth<HTMLSpanElement, HTMLSpanElement>(path)
  const onPage = TAB_PAGES.includes(path)

  useEffect(() => {
    const el = box.current
    if (!el || !onPage) return
    const read = () => {
      const hero = document.querySelector('[data-hero]')
      const stage = hero?.getAttribute('data-hero')
      const footer = document.querySelector('body footer')
      // Hidden only while the ” is still opening into the video.
      const open = !hero || stage === 'over' || stage === 'past'
      const atFooter = !!footer && footer.getBoundingClientRect().top < innerHeight - 24
      el.toggleAttribute('data-shown', open && !atFooter)
      // Over the video, while its ruler shows: just above the ruler, the sound switch's gap away.
      const ruler = document.querySelector('[data-hero-ruler]')
      if (ruler && scrollY < innerHeight * 0.25) {
        const top = ruler.getBoundingClientRect().top + scrollY
        const gap = Math.min(22, Math.max(10, innerWidth * 0.014))
        el.style.bottom = `${Math.round(innerHeight - top + gap)}px`
      } else el.style.removeProperty('bottom')
    }
    read()
    // The hero's stage changes (and its ruler arrives) without a scroll.
    const mo = new MutationObserver(read)
    const hero = document.querySelector('[data-hero]')
    if (hero) mo.observe(hero, { attributes: true, attributeFilter: ['data-hero'], childList: true })
    addEventListener('scroll', read, { passive: true })
    addEventListener('resize', read)
    return () => {
      mo.disconnect()
      removeEventListener('scroll', read)
      removeEventListener('resize', read)
    }
  }, [path, onPage])

  if (site === 'dot' || !onPage) return null
  return (
    <div ref={box} className="site-switch-tab hidden text-paper mix-blend-difference md:block">
      <SiteSwitchLink href={sitePath('dot')} toInch={false} label="DOT. — Men" className="flex flex-col items-start gap-[0.4em]">
        <span ref={label} className="whitespace-nowrap font-bold uppercase leading-none" style={{ fontStretch: '80%' }}>
          Men division
        </span>
        <span ref={dot} className="site-switch block origin-bottom-left text-[length:var(--tab)]">
          <DotBox />
        </span>
      </SiteSwitchLink>
    </div>
  )
}
