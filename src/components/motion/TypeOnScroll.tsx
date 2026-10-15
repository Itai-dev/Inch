'use client'

/**
 * Types the TypeText inside it with the scroll instead of the clock: as the block rises from the
 * bottom of the screen towards the middle its letters appear in order (each at its `--at`, read as
 * a share of the whole); scrolling back takes them away again. With reduced motion it's all there.
 */
import { useEffect, useRef } from 'react'

/** Where the block's top is (share of the screen's height) when typing starts and when it's done. */
const FROM = 0.92
const TO = 0.4

export function TypeOnScroll({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Letters in typing order, each with its moment as a share of the last one's.
    const chars = [...el.querySelectorAll<HTMLElement>('.type-char')]
    const ats = chars.map((c) => parseFloat(c.style.getPropertyValue('--at')) || 0)
    const last = Math.max(1, ...ats)
    let shown = -1
    let raf = 0
    const update = () => {
      raf = 0
      const top = el.getBoundingClientRect().top / innerHeight
      const p = Math.min(1, Math.max(0, (FROM - top) / (FROM - TO)))
      const n = p >= 1 ? chars.length : ats.filter((a) => a / last < p).length
      if (n === shown) return
      // Only the letters between the old count and the new one change.
      for (let i = Math.min(n, Math.max(0, shown)); i < Math.max(n, shown); i++) chars[i].style.opacity = i < n ? '1' : ''
      shown = n
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} data-type-scroll="" className={className}>
      {children}
    </div>
  )
}
