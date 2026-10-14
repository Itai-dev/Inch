'use client'

/**
 * An iPhone-style picker wheel, drawn as a piece of the INCH” ruler: the numbers roll past
 * a band between two rules, with a tick per value (a long one every fifth). Scroll, swipe,
 * drag, click a number, or use the arrow keys. Until it's touched it shows a typical value
 * in grey, like the height tape.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

const ROW = 40
const VISIBLE = 5
const PAD = ROW * ((VISIBLE - 1) / 2)

export function NumberWheel({
  label,
  items,
  labels,
  value,
  fallback,
  onChange,
  long = (v) => Number(v) % 5 === 0,
  onDone,
  className = '',
}: {
  /** Accessible name, e.g. "Waist, cm". */
  label: string
  items: string[]
  /** What to show for each item, when not the item itself (month names). */
  labels?: string[]
  value: string
  /** Shown, greyed, before anything is picked. */
  fallback: string
  onChange: (v: string) => void
  /** Which ticks are long (every fifth value by default). */
  long?: (item: string) => boolean
  /** Enter or Esc: the pick is made (closes the popover it sits in). */
  onDone?: () => void
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const touched = useRef(false)
  const frame = useRef(0)
  const drag = useRef<{ y: number; top: number; moved: boolean } | null>(null)
  const emitted = useRef<string | null>(null)
  /** Where a click or key is rolling the wheel to; the scroll doesn't pick values on the way. */
  const target = useRef<number | null>(null)
  const current = Math.max(0, items.indexOf(value || fallback))

  const emit = (v: string) => {
    emitted.current = v
    onChange(v)
  }
  const at = () => Math.min(items.length - 1, Math.max(0, Math.round((ref.current?.scrollTop ?? 0) / ROW)))

  // Numbers shrink and fade with their distance from the band.
  const paint = useCallback(() => {
    const el = ref.current
    if (!el) return
    const pos = el.scrollTop / ROW
    const rows = el.children
    for (let i = 0; i < rows.length; i++) {
      const d = Math.abs(i - pos)
      const row = rows[i] as HTMLElement
      row.style.opacity = String(Math.max(0.1, 1 - d * 0.34))
      row.style.transform = `scale(${1 - Math.min(d, 2.5) * 0.15})`
    }
  }, [])

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = current * ROW
    paint()
    // Only on mount: afterwards the wheel follows the hand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A value set from outside (a day clamped to the month) rolls the wheel to it.
  useEffect(() => {
    const el = ref.current
    if (!el || !value || value === emitted.current) return
    const i = items.indexOf(value)
    if (i < 0 || i === at()) return
    target.current = i
    el.scrollTo({ top: i * ROW, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const onScroll = () => {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      paint()
      const el = ref.current
      if (target.current !== null) {
        if (el && Math.abs(el.scrollTop - target.current * ROW) < 1) target.current = null
        return
      }
      const v = items[at()]
      if (touched.current && v !== value) emit(v)
    })
  }

  const go = (i: number) => {
    touched.current = true
    const n = Math.min(items.length - 1, Math.max(0, i))
    target.current = n
    ref.current?.scrollTo({ top: n * ROW, behavior: 'smooth' })
    if (items[n] !== value) emit(items[n])
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (onDone && (e.key === 'Enter' || e.key === 'Escape')) {
      // Close the wheel, not the whole application.
      e.preventDefault()
      e.stopPropagation()
      onDone()
      return
    }
    const step = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 }[e.key]
    if (step === undefined) return
    e.preventDefault()
    // From the value, not the scroll position: a smooth scroll may still be on its way.
    go((target.current ?? current) + step)
  }

  // Mouse: drag the wheel like a finger would. Touch and trackpads scroll natively.
  const hand = () => {
    touched.current = true
    target.current = null
  }
  const onPointerDown = (e: React.PointerEvent) => {
    hand()
    if (e.pointerType !== 'mouse' || !ref.current) return
    drag.current = { y: e.clientY, top: ref.current.scrollTop, moved: false }
    ref.current.style.scrollSnapType = 'none'
    ref.current.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const g = drag.current
    if (!g || !ref.current) return
    if (Math.abs(e.clientY - g.y) > 3) g.moved = true
    ref.current.scrollTop = g.top - (e.clientY - g.y)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const g = drag.current
    if (!g || !ref.current) return
    drag.current = null
    ref.current.releasePointerCapture(e.pointerId)
    ref.current.style.scrollSnapType = ''
    go(g.moved ? at() : rowAt(e.clientY))
  }
  // A tap or click picks the row under it.
  const rowAt = (y: number) => at() + Math.round((y - (ref.current?.getBoundingClientRect().top ?? 0) - PAD - ROW / 2) / ROW)
  const onClick = (e: React.MouseEvent) => {
    if ((e.nativeEvent as PointerEvent).pointerType !== 'mouse') go(rowAt(e.clientY))
  }

  const shown = labels?.[current] ?? items[current]
  return (
    <div className={`relative select-none ${className}`} style={{ height: ROW * VISIBLE }}>
      {/* The band: two rules, like the ruler's edges. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 border-y-2 border-fg" style={{ top: PAD, height: ROW }} />
      <div
        ref={ref}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuetext={value ? shown : undefined}
        aria-valuenow={value && !Number.isNaN(Number(value)) ? Number(value) : undefined}
        onScroll={onScroll}
        onWheel={hand}
        onTouchStart={hand}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        className={`h-full cursor-grab snap-y snap-mandatory overflow-y-scroll overscroll-contain outline-none focus-visible:bg-surface active:cursor-grabbing ${value ? 'text-fg' : 'text-muted'}`}
        style={{
          paddingBlock: PAD,
          scrollbarWidth: 'none',
          maskImage: 'linear-gradient(to bottom, transparent, #000 32%, #000 68%, transparent)',
        }}
      >
        {items.map((it, i) => (
          <div key={it} className="relative flex snap-center items-center justify-center will-change-transform" style={{ height: ROW }}>
            <span className="text-[26px] font-extrabold leading-none tabular-nums" style={{ fontStretch: '80%' }}>
              {labels?.[i] ?? it}
            </span>
            <span aria-hidden className={`absolute right-0 top-1/2 h-0.5 -translate-y-1/2 bg-current ${long(it) ? 'w-3' : 'w-1.5'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Values from `from` to `to`, `step` apart, as strings ("38.5"). */
export const range = (from: number, to: number, step = 1) =>
  Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => String(+(from + i * step).toFixed(1)))

/**
 * A measurement field that opens its wheel on tap, like a dropdown: closed it shows the value
 * on an underline; open, the wheel hangs below it. Opening picks the value shown, so what
 * you see is what's sent.
 */
export function WheelField({
  label,
  unit,
  items,
  labels,
  value,
  fallback,
  onChange,
  long,
}: {
  label: string
  unit: string
  items: string[]
  labels?: string[]
  value: string
  fallback: string
  onChange: (v: string) => void
  long?: (item: string) => boolean
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const show = (v: string) => labels?.[items.indexOf(v)] ?? v

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', away)
    ;(root.current?.querySelector('[role=spinbutton]') as HTMLElement | null)?.focus({ preventScroll: true })
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const close = () => {
    setOpen(false)
    button.current?.focus()
  }

  return (
    <div ref={root} className="relative flex min-w-0 flex-col gap-1.5">
      <span id={`${id}-label`} className="truncate text-[12px] font-bold uppercase tracking-[0.04em]" style={{ fontStretch: '80%' }}>
        {label} <span className="text-muted">{unit}</span>
      </span>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => {
          if (open) return setOpen(false)
          if (!value) onChange(fallback)
          setOpen(true)
        }}
        className={`flex w-full items-center gap-2 border-b-2 pb-1.5 text-left text-[clamp(20px,1.8vw,26px)] font-semibold tabular-nums outline-none ${value ? 'border-fg' : 'border-line focus-visible:border-fg'}`}
      >
        <span id={`${id}-value`} className={`min-w-0 flex-1 truncate ${value ? '' : 'text-muted/40'}`}>
          {show(value || fallback)}
        </span>
        <svg viewBox="0 0 12 8" aria-hidden className={`w-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full min-w-[112px] border-2 border-fg bg-bg px-2">
          <NumberWheel label={`${label}, ${unit}`} items={items} labels={labels} value={value} fallback={fallback} onChange={onChange} long={long} onDone={close} />
        </div>
      )}
    </div>
  )
}
