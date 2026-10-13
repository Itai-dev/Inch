'use client'

/**
 * Height input as an INCH” measuring tape: drag it (or use the arrow keys, the wheel, or click
 * a number) under the fixed needle. 1 cm = 12.8 px, a number every 5 cm.
 */
import { useEffect, useRef, useState } from 'react'

const MIN = 140
const MAX = 210
const PX = 12.8
const START = 175 // where the tape rests before it's touched

export function HeightTape({ value, onChange }: { value: number | null; onChange: (cm: number) => void }) {
  const v = value ?? START
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

  const set = (cm: number) => onChange(Math.max(MIN, Math.min(MAX, Math.round(cm))))
  const marks = Array.from({ length: (MAX - MIN) / 5 + 1 }, (_, i) => MIN + i * 5)

  return (
    <div
      ref={boxRef}
      role="slider"
      tabIndex={0}
      aria-label="Height"
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value ? `${value} cm` : 'Not set'}
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
        set(v + Math.sign(wheel.current))
        wheel.current = 0
      }}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 5 : 1
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
          backgroundImage: 'repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 12.8px)',
          backgroundSize: '100% 12px',
          backgroundPosition: 'left bottom',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {marks.map((cm) => (
          <div key={cm} className="absolute bottom-0 top-0" style={{ left: (cm - MIN) * PX }}>
            <span
              className="absolute top-0 w-10 -translate-x-1/2 text-center text-[14px] font-extrabold tabular-nums transition-opacity"
              style={{ opacity: Math.abs(cm - v) < 3 ? 1 : 0.4 }}
            >
              {cm}
            </span>
            <span className="absolute bottom-0 block h-[26px] w-[2px] bg-current" />
          </div>
        ))}
      </div>
      <span aria-hidden className="absolute bottom-0 left-1/2 block h-10 w-[3px] -translate-x-1/2 bg-fg" />
    </div>
  )
}
