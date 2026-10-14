'use client'

/**
 * Sizes on an INCH” measuring tape: drag it (or use the arrow keys, the wheel, or click a
 * number) under the fixed needle. The same tape serves height, bust, waist, hips and shoes,
 * in cm or inches; until it's touched it rests on a typical value.
 */
import { useEffect, useRef, useState } from 'react'
import { rulerTicks } from '@/lib/ruler'
import { cmToFeet } from '@/lib/units'

export type TapeScale = {
  min: number
  max: number
  /** Pixels per unit. */
  px: number
  /** Smallest step: one tick. */
  snap: number
  /** A number every this many units; (every / snap − 1) should be odd, so the ruler's taller middle tick lands on a tick. */
  every: number
  label?: (n: number) => string
}

export function Tape({
  label,
  value,
  start,
  scale: { min, max, px, snap, every, label: mark = String },
  onChange,
  valueText,
  onDone,
}: {
  /** Accessible name. */
  label: string
  value: number | null
  /** Where the tape rests before it's touched. */
  start: number
  scale: TapeScale
  onChange: (v: number) => void
  valueText?: (v: number) => string
  /** Enter or Esc. */
  onDone?: () => void
}) {
  const v = value ?? start
  const boxRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(640)
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ x: 0, v: 0, moved: false })
  const wheel = useRef(0)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const set = (x: number) => onChange(+Math.max(min, Math.min(max, Math.round(x / snap) * snap)).toFixed(1))
  const marks = Array.from({ length: Math.floor((max - min) / every) + 1 }, (_, i) => min + i * every)

  return (
    <div
      ref={boxRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value === null ? undefined : +value.toFixed(1)}
      aria-valuetext={value === null ? 'Not set' : (valueText?.(value) ?? String(value))}
      className="relative h-[58px] cursor-ew-resize touch-none select-none overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-fg"
      style={{ maskImage: 'linear-gradient(to right, transparent, black 22%, black 78%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 22%, black 78%, transparent)' }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { x: e.clientX, v, moved: false }
        setDragging(true)
      }}
      onPointerMove={(e) => {
        if (!dragging) return
        const dx = e.clientX - drag.current.x
        if (Math.abs(dx) > 3) drag.current.moved = true
        if (drag.current.moved) set(drag.current.v - dx / px)
      }}
      onPointerUp={(e) => {
        setDragging(false)
        // A click (no drag) jumps to the spot clicked.
        if (!drag.current.moved) {
          const r = e.currentTarget.getBoundingClientRect()
          set(v + (e.clientX - (r.left + r.width / 2)) / px)
        }
      }}
      onPointerCancel={() => setDragging(false)}
      onWheel={(e) => {
        wheel.current += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        if (Math.abs(wheel.current) < 24) return
        set(v + Math.sign(wheel.current) * snap)
        wheel.current = 0
      }}
      onKeyDown={(e) => {
        const step = (e.shiftKey ? every : 1) * snap
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(v + step)
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(v - step)
        else if (e.key === 'Home') set(min)
        else if (e.key === 'End') set(max)
        else if (onDone && (e.key === 'Enter' || e.key === 'Escape')) {
          // Close the tape, not the whole application.
          e.stopPropagation()
          onDone()
        } else return
        e.preventDefault()
      }}
    >
      {/* The INCH” ruler (as in the hero): a number and a full tick every `every`, a taller tick halfway, short ones between. */}
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: (max - min) * px + 1,
          transform: `translateX(${w / 2 - (v - min) * px}px)`,
          transition: dragging ? 'none' : 'transform 0.18s var(--ease-out)',
        }}
      >
        {marks.map((n, i) => (
          <div key={n} className="absolute bottom-0 top-0" style={{ left: (n - min) * px }}>
            <span
              className="absolute top-0 w-12 -translate-x-1/2 text-center text-[14px] font-bold leading-none tabular-nums transition-opacity"
              style={{ opacity: Math.abs(n - v) < every * 0.6 ? 1 : 0.4 }}
            >
              {mark(n)}
            </span>
            {i < marks.length - 1 ? (
              <span className="absolute bottom-0 left-0 block h-[26px]" style={{ width: every * px, ...rulerTicks(26, Math.round(every / snap) - 1, every * px) }} />
            ) : (
              <span className="absolute bottom-0 left-0 block h-[26px] w-[2px] bg-current" />
            )}
          </div>
        ))}
      </div>
      <span aria-hidden className="absolute bottom-0 left-1/2 block h-9 w-[2px] -translate-x-1/2 bg-fg" />
    </div>
  )
}

/** Height: in cm a tick a centimetre and a number every 10; in inches a tick every half inch, feet and inches every 2. Kept in cm. */
const HEIGHT = {
  cm: { min: 140, max: 210, px: 12.8, snap: 1, every: 10 },
  // 4′6″ to 7′0″; 25.6 px an inch, so the half-inch ticks sit as close as the centimetres.
  in: { min: 54, max: 84, px: 25.6, snap: 0.5, every: 2, label: (n: number) => cmToFeet(n * 2.54) },
} satisfies Record<string, TapeScale>

export function HeightTape({ value, onChange, unit = 'cm' }: { value: number | null; onChange: (cm: number) => void; unit?: 'cm' | 'in' }) {
  const toCm = unit === 'in' ? 2.54 : 1
  return (
    <Tape
      label="Height"
      value={value === null ? null : value / toCm}
      start={175 / toCm}
      scale={HEIGHT[unit]}
      onChange={(x) => onChange(Math.round(x * toCm))}
      valueText={(x) => (unit === 'cm' ? `${Math.round(x)} cm` : cmToFeet(x * 2.54))}
    />
  )
}

/** Values from `from` to `to`, `step` apart, as strings ("38.5"). */
export const range = (from: number, to: number, step = 1) =>
  Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => String(+(from + i * step).toFixed(1)))
