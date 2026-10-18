'use client'

/**
 * A pile of white-bordered prints. When the pile comes into view they land one after another, like
 * a stop-motion: each appears at once (a jump cut, no fade) and drops the last few pixels onto the
 * pile, quickly. Then any print can be picked up and moved anywhere on the page with the hand
 * (mouse) or a finger: caught, it turns a little and nudges aside the prints lying on it as it comes
 * to the top; moved, it leans with the movement.
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
  const drag = useRef<{ k: number; x: number; y: number; from: { x: number; y: number }; grab: number; lastX: number } | null>(null)

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

  /** The paper inside a print: it takes the shadow and the tilt (so the tilt can ease while the print follows the hand exactly). */
  const sheet = (k: number) => items.current[k]?.firstElementChild as HTMLElement | null | undefined
  const tilt = useRef(shown.map(() => 0))
  const setTilt = (k: number, deg: number) => {
    tilt.current[k] = deg
    sheet(k)?.style.setProperty('transform', `rotate(${deg.toFixed(2)}deg)`)
  }

  // Catching a print: it turns a little in the hand, and any print lying on it is pushed slightly
  // aside as it is pulled out from under them, so coming to the top makes sense.
  const onDown = (k: number) => (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const z = Number(el.style.zIndex) || 0
    items.current.forEach((other, j) => {
      if (!other || j === k || (Number(other.style.zIndex) || 0) < z) return
      const o = other.getBoundingClientRect()
      if (o.right < r.left || o.left > r.right || o.bottom < r.top || o.top > r.bottom) return
      // Away from the caught print's middle, a few pixels, with a touch of turn.
      const ox = o.left + o.width / 2 - cx
      const oy = o.top + o.height / 2 - cy
      const len = Math.hypot(ox, oy) || 1
      const push = 10 + Math.random() * 8
      const m = moved.current[j]
      moved.current[j] = { x: m.x + (ox / len) * push, y: m.y + (oy / len) * push }
      other.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
      other.style.setProperty('--dx', `${moved.current[j].x}px`)
      other.style.setProperty('--dy', `${moved.current[j].y}px`)
      setTilt(j, tilt.current[j] + (Math.random() - 0.5) * 3)
    })
    el.style.zIndex = String(++top.current)
    el.style.transition = 'none' // follow the hand exactly
    const sh = sheet(k)
    if (sh) sh.style.boxShadow = LIFTED
    // Caught off-centre, it turns toward the side it is held by.
    const grab = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 2))) * 3.5
    drag.current = { k, x: e.clientX, y: e.clientY, from: { ...moved.current[k] }, grab, lastX: e.clientX }
    setTilt(k, grab)
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
    // It leans with the movement, a little.
    const vx = e.clientX - d.lastX
    d.lastX = e.clientX
    setTilt(d.k, d.grab + Math.max(-6, Math.min(6, vx * 0.35)))
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (d) {
      const sh = sheet(d.k)
      if (sh) sh.style.boxShadow = SHADOW
      // Put down where it is, still a little askew.
      setTilt(d.k, d.grab * 0.4)
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
            className="absolute m-0 touch-none"
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              width: `${l.w}%`,
              zIndex: k + 1,
              // A jump cut in, then a short, quick drop onto the pile (no scaling).
              opacity: down ? 1 : 0,
              transform: down ? place(k) : `${place(k)} translateY(-14px)`,
              transition: down ? 'transform 0.14s cubic-bezier(0.55, 0, 0.9, 0.4)' : 'none',
            }}
          >
            <div className="bg-white p-[2.4%] transition-[transform,box-shadow] duration-300 ease-out" style={{ boxShadow: SHADOW }}>
              <span className="relative block overflow-hidden bg-line" style={{ aspectRatio: l.aspect }}>
                <Image src={p.src} alt={p.alt} fill draggable={false} sizes="(min-width: 768px) 26vw, 60vw" unoptimized={p.src.endsWith('.svg')} className="pointer-events-none object-cover grayscale contrast-[1.06]" />
              </span>
            </div>
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
