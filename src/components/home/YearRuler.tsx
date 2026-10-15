'use client'

/**
 * The story's ruler, in years: a year an inch, a month a tick. It slides under a fixed needle
 * as the page scrolls past, from the first year to this one; the years either side run on to
 * the screen's edges so the ruler never ends in view.
 */
import { useEffect, useRef } from 'react'
import { rulerTicks, SEG_OVERLAP } from '@/lib/ruler'

const YEAR_W = 160
/** Years drawn before the first and after the last: enough to reach the edges of a wide screen. */
const PAD = 12

export function YearRuler({ from, to }: { from: number; to: number }) {
  const band = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const years = Array.from({ length: to - from + 1 + 2 * PAD }, (_, i) => from - PAD + i)

  useEffect(() => {
    const el = band.current
    const t = track.current
    if (!el || !t) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const move = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        // 0 as the band comes up from the bottom of the screen, 1 as it leaves at the top.
        const p = reduce ? 1 : Math.min(1, Math.max(0, (innerHeight - r.bottom) / (innerHeight - r.height)))
        // The needle stands in the middle of the year it reads, under its number.
        t.style.transform = `translateX(${(el.clientWidth / 2 - (PAD + p * (to - from) + 0.5) * YEAR_W).toFixed(1)}px)`
      })
    }
    move()
    addEventListener('scroll', move, { passive: true })
    addEventListener('resize', move)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', move)
      removeEventListener('resize', move)
    }
  }, [from, to])

  return (
    <div ref={band} aria-hidden className="relative h-14 overflow-hidden">
      <div ref={track} className="absolute bottom-0 left-0 flex will-change-transform">
        {years.map((y) => (
          <span key={y} className="relative flex h-10 shrink-0 flex-col items-center justify-between" style={{ width: YEAR_W }}>
            <span className="text-[12px] font-bold leading-none tabular-nums">{y}</span>
            <span className="block h-[18px] self-start" style={{ width: `calc(100% + ${SEG_OVERLAP})`, ...rulerTicks(18, 11, YEAR_W) }} />
          </span>
        ))}
      </div>
      {/* The needle. */}
      <span className="absolute bottom-0 left-1/2 h-14 w-[2px] -translate-x-1/2 bg-current" />
    </div>
  )
}
