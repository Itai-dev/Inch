'use client'

/**
 * Height input as an INCH” measuring tape: drag it (or use the arrow keys, the wheel, or click
 * a number) under the fixed needle. In cm: a tick a centimetre, a number every 5. In inches:
 * a tick every half inch, feet and inches every 2. The height is always kept in cm.
 */
import { useEffect, useRef, useState } from 'react'
import { cmToFeet } from '@/lib/units'

const TAPES = {
  cm: { min: 140, max: 210, px: 12.8, snap: 1, every: 5, toCm: 1, label: (n: number) => String(n) },
  // 4′6″ to 7′0″; 25.6 px an inch, so the half-inch ticks sit as close as the centimetres.
  in: { min: 54, max: 84, px: 25.6, snap: 0.5, every: 2, toCm: 2.54, label: (n: number) => cmToFeet(n * 2.54) },
} as const
const START_CM = 175 // where the tape rests before it's touched

export function HeightTape({ value, onChange, unit = 'cm' }: { value: number | null; onChange: (cm: number) => void; unit?: 'cm' | 'in' }) {
  const { min: MIN, max: MAX, px: PX, snap, every, toCm, label } = TAPES[unit]
  const v = (value ?? START_CM) / toCm
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

  const set = (x: number) => onChange(Math.round(Math.max(MIN, Math.min(MAX, Math.round(x / snap) * snap)) * toCm))
  const marks = Array.from({ length: (MAX - MIN) / every + 1 }, (_, i) => MIN + i * every)

  return (
    <div
      ref={boxRef}
      role="slider"
      tabIndex={0}
      aria-label="Height"
      aria-valuemin={MIN * toCm}
      aria-valuemax={MAX * toCm}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value ? (unit === 'cm' ? `${value} cm` : cmToFeet(value)) : 'Not set'}
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
        if (drag.current.moved) set(drag.current.v - dx / PX)
      }}
      onPointerUp={(e) => {
        setDragging(false)
        // A click (no drag) jumps to the spot clicked.
        if (!drag.current.moved) {
          const r = e.currentTarget.getBoundingClientRect()
          set(v + (e.clientX - (r.left + r.width / 2)) / PX)
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
        else if (e.key === 'Home') set(MIN)
        else if (e.key === 'End') set(MAX)
        else return
        e.preventDefault()
      }}
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: (MAX - MIN) * PX + 1,
          transform: `translateX(${w / 2 - (v - MIN) * PX}px)`,
          transition: dragging ? 'none' : 'transform 0.18s var(--ease-out)',
          backgroundImage: `repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px ${PX * snap}px)`,
          backgroundSize: '100% 12px',
          backgroundPosition: 'left bottom',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {marks.map((n) => (
          <div key={n} className="absolute bottom-0 top-0" style={{ left: (n - MIN) * PX }}>
            <span
              className="absolute top-0 w-12 -translate-x-1/2 text-center text-[14px] font-extrabold tabular-nums transition-opacity"
              style={{ opacity: Math.abs(n - v) < every * 0.6 ? 1 : 0.4 }}
            >
              {label(n)}
            </span>
            <span className="absolute bottom-0 block h-[26px] w-[2px] bg-current" />
          </div>
        ))}
      </div>
      <span aria-hidden className="absolute bottom-0 left-1/2 block h-10 w-[3px] -translate-x-1/2 bg-fg" />
    </div>
  )
}
