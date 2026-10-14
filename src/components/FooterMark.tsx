'use client'

/**
 * The footer's wordmark, cut in half by the bottom of the page: the page ends with only its
 * top half in view. It grows in from the left as the footer scrolls up.
 */
import { useEffect, useRef } from 'react'

export function FooterMark({ ratio, children }: { ratio: number; children: React.ReactNode }) {
  const crop = useRef<HTMLDivElement>(null)
  const mark = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const c = crop.current
    const m = mark.current
    if (!c || !m) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const grow = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = c.getBoundingClientRect()
        // 0 as the strip comes up from the bottom of the screen, 1 once all of it is in view.
        const p = Math.min(1, Math.max(0, (innerHeight - r.top) / r.height))
        const e = 1 - (1 - p) ** 3
        m.style.transform = `scale(${(0.25 + 0.75 * e).toFixed(4)})`
      })
    }
    grow()
    addEventListener('scroll', grow, { passive: true })
    addEventListener('resize', grow)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', grow)
      removeEventListener('resize', grow)
    }
  }, [])

  // Half the wordmark's height: the rest is below the end of the page.
  return (
    <div ref={crop} aria-hidden className="overflow-hidden" style={{ aspectRatio: `${ratio * 2}` }}>
      <div ref={mark} className="origin-bottom-left will-change-transform [&_svg]:!h-auto [&_svg]:!w-full">
        {children}
      </div>
    </div>
  )
}
