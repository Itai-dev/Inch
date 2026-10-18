'use client'

/**
 * The footer's top edge as water a ball has dropped into: it arrives with a round dip in the middle
 * and levels out as it rises up the screen. Drawn as the colour above (--above) cut into the
 * footer's top, so it works on any page.
 */
import { useEffect, useRef } from 'react'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function FooterDip() {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = ref.current
    const footer = svg?.parentElement
    if (!svg || !footer || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const read = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // Deepest as the footer comes into view; flat once its top is halfway up the screen.
        const p = clamp01((innerHeight - footer.getBoundingClientRect().top) / (innerHeight * 0.5))
        const depth = Math.min(innerWidth * 0.12, 180) * (1 - p) ** 1.3
        svg.style.height = `${depth.toFixed(1)}px`
      })
    }
    read()
    addEventListener('scroll', read, { passive: true })
    addEventListener('resize', read)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', read)
      removeEventListener('resize', read)
    }
  }, [])

  return (
    <svg ref={ref} aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 z-10 block w-full" style={{ height: 0 }}>
      {/* Flat at the sides, easing down into a round dip in the middle. */}
      <path d="M0 0H100C78 0 74 100 50 100C26 100 22 0 0 0Z" fill="var(--above)" />
    </svg>
  )
}
