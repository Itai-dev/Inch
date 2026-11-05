'use client'

/**
 * The other site's box, in the bottom-left corner, the same on both sites: on INCH” DOT.'s, on DOT.
 * INCH”'s. (Also in the phone menu, MobileMenu.)
 */
import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { sitePath, type Site } from '@/lib/sites'
import { DotBox, Logo } from './brand/Logo'
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

/** Only these pages carry the tab, on either site (/logotest is the home page too). */
const TAB_PAGES = ['/', '/contact', '/logotest']

/**
 * On the home and contact pages of both sites: the other site's box in the bottom-left corner, its
 * division ("Men division", "Women division") above it, as wide as the box. On the home page it pops
 * up as soon as the video has opened, standing just above the hero's ruler, and drops to the corner
 * once the ruler fades away. It goes again when the footer arrives. White + difference blend like the
 * header, so it inverts against whatever is behind it. On phones too, in the same places at the same moments.
 */
export function SiteSwitch({ site }: { site: Site }) {
  const box = useRef<HTMLDivElement>(null)
  const path = usePathname().replace(/^\/(inch|dot)(?=\/|$)/, '') || '/'
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
      // Over the video, while its ruler shows: just above the ruler, a small gap away.
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

  if (!onPage) return null
  const toInch = site === 'dot'
  return (
    <div ref={box} className="site-switch-tab text-paper mix-blend-difference">
      <SiteSwitchLink href={sitePath(toInch ? 'inch' : 'dot')} toInch={toInch} label={toInch ? 'INCH” — Women' : 'DOT. — Men'} className="flex flex-col items-start gap-[0.4em]">
        <span ref={label} className="whitespace-nowrap font-bold uppercase leading-none" style={{ fontStretch: '80%' }}>
          {toInch ? 'Women division' : 'Men division'}
        </span>
        <span ref={dot} className="site-switch block origin-bottom-left text-[length:var(--tab)]">
          {toInch ? (
            // INCH”'s box: the wordmark cut out of a white block, as tall as DOT.'s.
            <span className="flex h-[1.097em] items-center bg-current pl-[0.16em] pr-[0.14em]">
              <Logo division="women" className="text-[1em] text-ink [&_svg]:!h-[0.7em]" />
            </span>
          ) : (
            <DotBox />
          )}
        </span>
      </SiteSwitchLink>
    </div>
  )
}
