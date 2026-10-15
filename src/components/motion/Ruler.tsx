'use client'

/**
 * INCH” — the ruler. A looping measuring tape numbered 01…N that both shows
 * and controls a carousel: click a number, or let the carousel move it. Shared by the home hero (big, white) and the model books (small).
 *
 * Positions are unbounded slide indices (…, -1, 0, 1, …, N, N+1, …) so the tape
 * always slides the short way round; numbers wrap with `mod`.
 */
import { useEffect, useRef, useState } from 'react'
import { rulerTicks } from '@/lib/ruler'

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
  const tickBg = rulerTicks(tickH, minors, segW)

  // Faded tape: the selected inches at full strength, each inch further out a step fainter, every
  // tick of an inch alike (an inch is lit whole); only the far ends fade into the edges.
  const lit = (Math.max(1, active.length) - 1) / 2
  const strength = (k: number) => {
    const d = Math.round(Math.max(0, Math.abs(k - pos) - lit))
    return d === 0 ? 1 : Math.max(0.1, 0.4 - (d - 1) * 0.1)
  }
  const mask = 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)'

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
          return (
            <div key={k} className="transition-opacity duration-500" style={{ opacity: strength(k) }}>
              <span
                className="absolute top-0 flex items-start justify-center font-bold leading-none tabular-nums"
                style={{ left: k * segW, width: segW, height: labelH, fontSize: fontPx }}
              >
                {pad2(mod(k, N) + 1)}
              </span>
              {/* 1px wider than its inch, so its closing tick lies on the next one's opening tick. */}
              <span className="absolute bottom-0 block" style={{ left: k * segW, width: segW + 1, height: tickH, ...tickBg }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
