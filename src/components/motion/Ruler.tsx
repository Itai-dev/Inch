'use client'

/**
 * INCH” — the ruler. A looping measuring tape numbered 01…N that both shows
 * and controls a carousel: click a number, or let the carousel move it. Shared by the home hero (big, white) and the model books (small).
 *
 * Positions are unbounded slide indices (…, -1, 0, 1, …, N, N+1, …) so the tape
 * always slides the short way round; numbers wrap with `mod`.
 */
import { useEffect, useRef, useState } from 'react'

const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const mod = (a: number, n: number) => ((a % n) + n) % n

export type RulerProps = {
  count: number
  /** Unbounded centre of the tape, in slide-index units (slide i is centred at i). */
  pos: number
  /** Slide indices (0-based) drawn at full strength. */
  active: number[]
  /** Called with an unbounded slide index when a number is clicked. */
  onSelect: (k: number) => void
  segW?: number
  fontPx?: number
  tickH?: number
  /** Minor ticks between two numbers (odd, so the middle one can be taller). */
  minors?: number
  reduced?: boolean
  /** Tape slide timing (ms + CSS easing). */
  duration?: number
  easing?: string
  className?: string
}

export function Ruler({ count: N, pos, active, onSelect, segW = 32, fontPx = 10, tickH = 8, minors = 3, reduced, duration = 500, easing = EASE, className = '' }: RulerProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(1200)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Render well past the edges so a jump of a few numbers still slides over real ticks.
  const R = Math.ceil(w / segW / 2) + 12
  const from = Math.floor(pos) - R
  const ks = Array.from({ length: R * 2 + 1 }, (_, j) => from + j)

  // Numbers sit just above the ticks.
  const labelH = Math.round(fontPx * 1.05)
  const height = labelH + Math.round(fontPx * 0.15) + tickH
  const majorW = tickH >= 24 ? 2 : 1
  const sub = segW / (minors + 1)
  const tickBg = {
    backgroundImage: [
      'linear-gradient(currentColor, currentColor)',
      'linear-gradient(currentColor, currentColor)',
      `repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px ${sub}px)`,
    ].join(','),
    backgroundSize: `${majorW}px ${tickH}px, 1px ${Math.round(tickH * 0.7)}px, 100% ${Math.round(tickH * 0.45)}px`,
    backgroundPosition: 'left bottom, 50% bottom, left bottom',
    backgroundRepeat: 'no-repeat',
  } as const

  // Faded tape (Figma Make carousel): only the centre is at full strength, falling away to the sides.
  const half = segW * (0.53 + (Math.max(1, active.length) - 1) * 0.5)
  const mask = [
    `linear-gradient(to right, transparent, rgba(0,0,0,0.12) calc(50% - ${half + segW * 2.6}px), rgba(0,0,0,0.38) calc(50% - ${half + segW * 0.6}px), black calc(50% - ${half}px), black calc(50% + ${half}px), rgba(0,0,0,0.38) calc(50% + ${half + segW * 0.6}px), rgba(0,0,0,0.12) calc(50% + ${half + segW * 2.6}px), transparent)`,
    `radial-gradient(ellipse ${Math.round(segW * 7)}px 100% at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 100%)`,
  ].join(', ')

  // Click a number to go to it (no dragging).
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onSelect(Math.round(pos + (e.clientX - (rect.left + rect.width / 2)) / segW))
  }

  return (
    <div
      ref={boxRef}
      aria-hidden
      className={`relative w-full select-none overflow-hidden ${className}`}
      style={{ height, cursor: 'pointer', maskImage: mask, WebkitMaskImage: mask }}
      onClick={onClick}
    >
      <div
        className="absolute inset-y-0 left-1/2"
        style={{
          transform: `translateX(${-(pos + 0.5) * segW}px)`,
          transition: reduced ? 'none' : `transform ${duration}ms ${easing}`,
          willChange: 'transform',
        }}
      >
        {ks.map((k) => {
          // Only the copy under the centre counts as selected (numbers repeat along the tape).
          const on = Math.abs(k - pos) <= (Math.max(1, active.length) - 1) / 2 + 0.01
          return (
            <div key={k}>
              <span
                className="absolute top-0 flex items-start justify-center font-bold leading-none tabular-nums transition-opacity duration-500"
                style={{ left: k * segW, width: segW, height: labelH, fontSize: fontPx, opacity: on ? 1 : 0.4 }}
              >
                {pad2(mod(k, N) + 1)}
              </span>
              <span className="absolute bottom-0 block" style={{ left: k * segW, width: segW, height: tickH, ...tickBg }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
