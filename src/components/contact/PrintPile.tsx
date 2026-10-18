'use client'

/**
 * A pile of white-bordered prints. When the pile comes into view they land one after another, like
 * a stop-motion: each appears at once (a jump cut, no fade) and drops the last few pixels onto the
 * pile, quickly. Then any print can be picked up and moved anywhere on the page with the hand
 * (mouse) or a finger; the one picked up comes to the top.
 */
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { HAND_PX, HandIcon } from '@/components/HandCursor'

export type Print = { src: string; alt: string }

/** Each print: its width (share of the pile's), shape, where its centre lands (% of the pile) and its angle. Back to front. */
const LAYOUT = [
  { w: 74, aspect: '4 / 3', x: 50, y: 30, r: 0 },
  { w: 60, aspect: '3 / 4', x: 27, y: 50, r: -0.6 },
  { w: 58, aspect: '3 / 4', x: 74, y: 52, r: 0.8 },
  { w: 76, aspect: '4 / 3', x: 47, y: 72, r: -0.4 },
  { w: 56, aspect: '3 / 4', x: 38, y: 47, r: 0.5 },
  { w: 64, aspect: '3 / 4', x: 57, y: 50, r: 0 },
]
const LAND_MS = 280
const SHADOW = '0 1px 2px rgb(0 0 0 / 0.08), 4px 12px 24px -12px rgb(0 0 0 / 0.35)'
const LIFTED = '0 2px 4px rgb(0 0 0 / 0.08), 14px 30px 46px -16px rgb(0 0 0 / 0.4)'

export function PrintPile({ prints, className = '' }: { prints: Print[]; className?: string }) {
  const pile = useRef<HTMLDivElement>(null)
  const hand = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLElement | null)[]>([])
  const shown = prints.slice(0, LAYOUT.length)
  const count = shown.length
  const [landed, setLanded] = useState(0)
  /** Where each print has been moved to (px from where it landed), and the top of the pile. */
  const moved = useRef(shown.map(() => ({ x: 0, y: 0 })))
  const top = useRef(LAYOUT.length)
  const drag = useRef<{ k: number; x: number; y: number; from: { x: number; y: number } } | null>(null)

  // They land once the pile is in view.
  useEffect(() => {
    const el = pile.current
    if (!el) return
    const timers: number[] = []
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timers.push(window.setTimeout(() => setLanded(count)))
      return () => timers.forEach(clearTimeout)
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        for (let k = 0; k < count; k++) timers.push(window.setTimeout(() => setLanded(k + 1), 150 + k * LAND_MS))
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [count])

  // Where a print has been moved to lives in --dx/--dy, set while it is dragged.
  const place = (k: number) => `translate(-50%, -50%) translate(var(--dx, 0px), var(--dy, 0px)) rotate(${LAYOUT[k].r}deg)`

  // The hand shows over a print (and while one is held), the open hand closing on it when pressed.
  const handAt = (e: React.PointerEvent, held?: boolean) => {
    const h = hand.current
    const el = pile.current
    if (!h || !el || e.pointerType !== 'mouse') return
    const over = !!(e.target as Element).closest?.('[data-print]') || !!drag.current
    el.style.cursor = over ? 'none' : ''
    h.style.opacity = over ? '1' : '0'
    const r = el.getBoundingClientRect()
    h.style.transform = `translate(${(e.clientX - r.left - HAND_PX / 2).toFixed(1)}px, ${(e.clientY - r.top - HAND_PX / 2).toFixed(1)}px)`
    if (held === true) h.dataset.held = ''
    if (held === false) delete h.dataset.held
  }

  const onDown = (k: number) => (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    el.style.zIndex = String(++top.current)
    el.style.boxShadow = LIFTED
    el.style.transition = 'box-shadow 0.2s' // follow the hand exactly
    drag.current = { k, x: e.clientX, y: e.clientY, from: { ...moved.current[k] } }
    handAt(e, true)
  }
  const onMove = (e: React.PointerEvent) => {
    handAt(e)
    const d = drag.current
    const el = d && items.current[d.k]
    if (!d || !el) return
    const m = { x: d.from.x + e.clientX - d.x, y: d.from.y + e.clientY - d.y }
    moved.current[d.k] = m
    el.style.setProperty('--dx', `${m.x}px`)
    el.style.setProperty('--dy', `${m.y}px`)
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (d) {
      const el = items.current[d.k]
      if (el) el.style.boxShadow = SHADOW
      drag.current = null
    }
    handAt(e, false)
  }

  return (
    <div
      ref={pile}
      className={`relative select-none ${className}`}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={() => {
        if (drag.current || !hand.current || !pile.current) return
        hand.current.style.opacity = '0'
        pile.current.style.cursor = ''
      }}
    >
      {shown.map((p, k) => {
        const l = LAYOUT[k]
        const down = k < landed
        return (
          <figure
            key={k}
            data-print
            ref={(n) => {
              items.current[k] = n
            }}
            onPointerDown={onDown(k)}
            className="absolute m-0 bg-white p-[2.4%] touch-none"
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              width: `${l.w}%`,
              zIndex: k + 1,
              // A jump cut in, then a short, quick drop onto the pile (no scaling).
              opacity: down ? 1 : 0,
              transform: down ? place(k) : `${place(k)} translateY(-14px)`,
              boxShadow: SHADOW,
              transition: down ? 'transform 0.14s cubic-bezier(0.55, 0, 0.9, 0.4)' : 'none',
            }}
          >
            <span className="relative block overflow-hidden bg-line" style={{ aspectRatio: l.aspect }}>
              <Image src={p.src} alt={p.alt} fill draggable={false} sizes="(min-width: 768px) 26vw, 60vw" unoptimized={p.src.endsWith('.svg')} className="pointer-events-none object-cover grayscale contrast-[1.06]" />
            </span>
          </figure>
        )
      })}

      {/* The hand (mouse only). */}
      <div ref={hand} aria-hidden className="group/hand pointer-events-none absolute left-0 top-0 z-[999] opacity-0 transition-opacity duration-150" style={{ width: HAND_PX, height: HAND_PX }}>
        <span className="absolute inset-0 group-data-[held]/hand:hidden">
          <HandIcon kind="open" />
        </span>
        <span className="absolute inset-0 hidden group-data-[held]/hand:block">
          <HandIcon kind="held" />
        </span>
      </div>
    </div>
  )
}
