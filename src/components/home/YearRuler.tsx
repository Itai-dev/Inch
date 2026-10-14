'use client'

/**
 * The story's ruler, in years: a year an inch, a month a tick. It slides under a fixed needle
 * as the page scrolls past, from the first year to this one.
 */
import { useEffect, useRef } from 'react'
import { rulerTicks } from '@/lib/ruler'

const YEAR_W = 160

export function YearRuler({ from, to }: { from: number; to: number }) {
  const band = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const years = Array.from({ length: to - from + 1 }, (_, i) => from + i)

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
        t.style.transform = `translateX(${(el.clientWidth / 2 - p * (to - from) * YEAR_W).toFixed(1)}px)`
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
        {years.map((y, i) => (
          <span key={y} className="relative flex h-10 shrink-0 flex-col justify-between" style={{ width: i < years.length - 1 ? YEAR_W : 2 }}>
            <span className="-translate-x-1/2 text-[12px] font-bold leading-none tabular-nums">{y}</span>
            <span className="block h-[18px]" style={i < years.length - 1 ? rulerTicks(18, 11, YEAR_W) : { width: 2, background: 'currentColor' }} />
          </span>
        ))}
      </div>
      {/* The needle. */}
      <span className="absolute bottom-0 left-1/2 h-14 w-[2px] -translate-x-1/2 bg-current" />
    </div>
  )
}
