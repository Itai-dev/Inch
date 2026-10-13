'use client'

/**
 * A model's name, written in when the page opens.
 * INCH”: a ” in front of the name splits — the left stroke stays, the right one writes the
 * name letter by letter and closes it. DOT.: a blinking ■ writes it and lands as the full stop.
 * The strokes hang from the top of the capitals.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { QuoteStroke, STROKE_GAP_RATIO, STROKE_RATIO } from '@/components/brand/Marks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Division } from '@/sanity/lib/types'

const DELAY_MS = 100
const SPLIT_MS = 180 // INCH”: the ” opens before the first letter
const CHAR_MS = 45

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Where the capitals start and the baseline sits, from the top of an inline box (px). */
function metrics(el: HTMLElement) {
  const cs = getComputedStyle(el)
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return { capTop: 0, baseline: el.getBoundingClientRect().height * 0.8 }
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  const m = ctx.measureText('H')
  return { capTop: m.fontBoundingBoxAscent - m.actualBoundingBoxAscent, baseline: m.fontBoundingBoxAscent }
}

export function NameOpen({ name, division, className = '' }: { name: string; division: Division; className?: string }) {
  const reduced = useReducedMotion()
  const dot = division === 'men'
  const chars = name.split('')
  const split = dot ? 0 : SPLIT_MS
  const total = DELAY_MS + split + chars.length * CHAR_MS

  const [t, setT] = useState(0) // ms since mount
  useEffect(() => {
    if (reduced) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const v = Math.min(total, now - t0)
      setT(v)
      if (v < total) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, total])
  const done = reduced || t >= total
  const splitT = done || !split ? 1 : easeOut(Math.min(1, Math.max(0, (t - DELAY_MS) / split)))
  const shown = done ? chars.length : Math.max(0, Math.min(chars.length, Math.floor((t - DELAY_MS - split) / CHAR_MS) + 1))

  const wrapRef = useRef<HTMLHeadingElement>(null)
  const leftRef = useRef<HTMLSpanElement>(null)
  const rightRef = useRef<HTMLSpanElement>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [font, setFont] = useState(44)
  const [, bump] = useState(0)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const read = () => setFont(parseFloat(getComputedStyle(el).fontSize) || 44)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    // A late web font changes the letters' sizes: place the marks again.
    document.fonts?.ready.then(() => bump((n) => n + 1))
    return () => ro.disconnect()
  }, [])

  const markH = Math.round(font * 0.42)
  const markW = Math.round(markH * STROKE_RATIO)
  const strokeGap = Math.round(markH * STROKE_GAP_RATIO)
  const sideGap = Math.round(font * 0.12)
  // The ” sits inside the margin, in front of the name (the name is padded to make room).
  const lead = dot ? 0 : markW + sideGap

  // The marks are placed straight on the DOM, measured against the letters.
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const right = rightRef.current
    const first = charRefs.current[0]
    if (!wrap || !right || !first) return
    const wr = wrap.getBoundingClientRect()
    const fr = first.getBoundingClientRect()
    const { capTop, baseline } = metrics(first)
    const put = (el: HTMLElement, x: number, y: number) => {
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    const last = shown > 0 ? charRefs.current[shown - 1] : null
    const lr = last?.getBoundingClientRect()
    if (dot) {
      // ■ sits on the baseline after the last letter written, like a full stop.
      const r = lr ?? fr
      const size = right.offsetWidth
      return put(right, lr ? r.right - wr.left + size * 0.3 : r.left - wr.left, r.top - wr.top + baseline - size)
    }
    const top = fr.top - wr.top + capTop
    if (leftRef.current) put(leftRef.current, 0, top)
    // Closed ” in front of the name → split → the right stroke rides after the last letter written.
    const x = lr ? lr.right - wr.left + sideGap : lerp(markW + strokeGap, fr.left - wr.left, splitT)
    put(right, x, lr ? lr.top - wr.top + capTop : top)
  })

  return (
    <h1 ref={wrapRef} aria-label={name} className={`relative ${className}`} style={{ paddingLeft: lead }}>
      {!dot && (
        <span ref={leftRef} aria-hidden className="pointer-events-none absolute left-0 top-0 block">
          <QuoteStroke side="left" height={markH} />
        </span>
      )}
      <span
        ref={rightRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 block"
        style={dot ? { width: Math.round(font * 0.2), aspectRatio: '1', background: 'currentColor', animation: done ? 'none' : 'dot-cursor 0.9s steps(1) infinite' } : undefined}
      >
        {!dot && <QuoteStroke side="right" height={markH} />}
      </span>
      {chars.map((c, i) => (
        <span
          key={i}
          aria-hidden
          ref={(el) => {
            charRefs.current[i] = el
          }}
          style={{ visibility: i < shown ? 'visible' : 'hidden' }}
        >
          {c}
        </span>
      ))}
    </h1>
  )
}
