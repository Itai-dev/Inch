'use client'

/**
 * A model's name, written in when the page opens.
 * INCH”: a ” in front of the name splits — the left stroke stays, the right one glides along
 * the name, each letter appearing as it passes, and closes it. DOT.: a blinking ■ writes it the
 * same way and lands as the full stop. The strokes hang from the top of the capitals.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { QuoteStroke, STROKE_GAP_RATIO, STROKE_RATIO } from '@/components/brand/Marks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Division } from '@/sanity/lib/types'

const DELAY_MS = 0 // starts the moment the page opens
const SPLIT_MS = 120 // INCH”: the ” opens before the first letter
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
  const n = chars.length
  const split = dot ? 0 : SPLIT_MS
  // INCH”: the split carries the stroke past the first letter, then a letter every CHAR_MS.
  const total = DELAY_MS + (dot ? n * CHAR_MS : split + Math.max(0, n - 1) * CHAR_MS)

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
  // Where the moving mark is, in letters: 0 = before the name (INCH”: the ” still closed), k = just after letter k.
  const e = Math.max(0, t - DELAY_MS)
  const pos = done ? n : dot ? Math.min(n, e / CHAR_MS) : e < split ? easeOut(e / split) : Math.min(n, 1 + (e - split) / CHAR_MS)
  // A letter appears as the mark crosses its middle.
  const shown = done ? n : Math.max(0, Math.min(n, Math.floor(pos + 0.5)))

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
    // The mark's stops: before the name, then just after each letter. It glides between them.
    const size = right.offsetWidth
    const gap = dot ? size * 0.3 : sideGap
    const yOf = (r: DOMRect) => (dot ? r.top - wr.top + baseline - size : r.top - wr.top + capTop)
    const stop = (k: number) => {
      if (k === 0) return { x: dot ? fr.left - wr.left : markW + strokeGap, y: yOf(fr) }
      const r = charRefs.current[k - 1]!.getBoundingClientRect()
      return { x: r.right - wr.left + gap, y: yOf(r) }
    }
    const k = Math.min(n - 1, Math.floor(pos))
    let a = stop(k)
    const b = stop(Math.min(n, k + 1))
    const f = pos >= n ? 1 : pos - k
    // A new line: no sweep back across the page; the mark starts again at the head of the line.
    if (a.y !== b.y) a = { x: charRefs.current[k]!.getBoundingClientRect().left - wr.left, y: b.y }
    const p = { x: lerp(a.x, b.x, f), y: b.y }
    if (!dot && leftRef.current) {
      put(leftRef.current, 0, yOf(fr))
      leftRef.current.style.visibility = 'visible'
    }
    put(right, p.x, p.y)
    right.style.visibility = 'visible'
  })

  return (
    <h1 ref={wrapRef} aria-label={name} className={`relative ${className}`} style={{ paddingLeft: lead }}>
      {!dot && (
        <span ref={leftRef} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 block">
          <QuoteStroke side="left" height={markH} />
        </span>
      )}
      <span
        ref={rightRef}
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 block"
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
