'use client'

/**
 * A model's name, opened like the home page's "Text open".
 * INCH”: the ” sits in front of the name, then splits — the left stroke stays, the right
 * one travels with the letters as they fade in and closes the name. DOT.: a ■ jumps word
 * by word and lands as the full stop. Plays once, when the page opens.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { QuoteStroke, STROKE_GAP_RATIO, STROKE_RATIO } from '@/components/brand/Marks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Division } from '@/sanity/lib/types'

const DELAY_MS = 250
const TOTAL_MS = 1100
const SPLIT = 0.22 // share of the run spent opening the ”
const FADE_CHARS = 5
const WORD_MS = 280

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function NameOpen({ name, division, className = '' }: { name: string; division: Division; className?: string }) {
  const reduced = useReducedMotion()
  const dot = division === 'men'
  const words = name.split(/\s+/)
  const total = dot ? DELAY_MS + words.length * WORD_MS : DELAY_MS + TOTAL_MS

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
  const run = done ? 1 : Math.max(0, (t - DELAY_MS) / (total - DELAY_MS))

  const wrapRef = useRef<HTMLHeadingElement>(null)
  const rightRef = useRef<HTMLSpanElement>(null)
  const unitRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [font, setFont] = useState(44)
  const [, bump] = useState(0)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const read = () => setFont(parseFloat(getComputedStyle(el).fontSize) || 44)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    // A late web font changes the letters' widths: place the closing mark again.
    document.fonts?.ready.then(() => bump((n) => n + 1))
    return () => ro.disconnect()
  }, [])

  // INCH”: letters fade in behind the travelling stroke. DOT.: whole words appear, one per step.
  const units = dot ? words : name.split('')
  const splitT = easeOut(Math.min(1, run / SPLIT))
  const revealP = Math.max(0, (run - SPLIT) / (1 - SPLIT))
  const cursor = done ? units.length + FADE_CHARS : revealP * (units.length + FADE_CHARS)
  const shown = done ? units.length : Math.min(units.length, Math.ceil(run * units.length))

  const markH = Math.round(font * 0.42)
  const markW = Math.round(markH * STROKE_RATIO)
  const strokeGap = Math.round(markH * STROKE_GAP_RATIO)
  const topNudge = Math.round(font * 0.14)
  const sideGap = Math.round(font * 0.13)
  // The ” sits inside the margin, in front of the name (the name is padded to make room).
  const lead = dot ? 0 : markW + sideGap

  // The moving mark is placed straight on the DOM (no extra render per frame).
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const mark = rightRef.current
    if (!wrap || !mark) return
    const wr = wrap.getBoundingClientRect()
    const put = (x: number, y: number, visible = true) => {
      mark.style.transform = `translate(${x}px, ${y}px)`
      mark.style.opacity = visible ? '1' : '0'
    }
    const el = (i: number) => unitRefs.current[i]
    if (dot) {
      const last = shown > 0 ? el(shown - 1) : null
      const size = mark.offsetWidth
      if (!last) return put(0, 0)
      const r = last.getBoundingClientRect()
      return put(r.right - wr.left + size * 0.35, r.top - wr.top + r.height * 0.8 - size)
    }
    const first = el(0)
    if (splitT < 1 || cursor <= 0) {
      const firstRight = first ? first.getBoundingClientRect().right - wr.left + sideGap : sideGap
      return put(lerp(markW + strokeGap, firstRight, splitT), topNudge)
    }
    const at = el(Math.min(units.length - 1, Math.max(0, done ? units.length - 1 : Math.floor(cursor))))
    if (!at) return
    const lr = at.getBoundingClientRect()
    const next = done ? null : el(Math.floor(cursor) + 1)
    const newRow = next ? Math.abs(next.getBoundingClientRect().top - lr.top) > 4 : false
    put(lr.right - wr.left + sideGap, lr.top - wr.top + topNudge, !newRow)
  })

  return (
    <h1 ref={wrapRef} aria-label={name} className={`relative ${className}`} style={{ paddingLeft: lead }}>
      {!dot && (
        <span aria-hidden className="pointer-events-none absolute left-0 block" style={{ top: topNudge }}>
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
      {units.map((u, i) => (
        <span key={i} aria-hidden>
          <span
            ref={(el) => {
              unitRefs.current[i] = el
            }}
            style={dot ? { visibility: i < shown ? 'visible' : 'hidden' } : { opacity: Math.min(1, Math.max(0, (cursor - i) / FADE_CHARS)) }}
          >
            {u}
          </span>
          {dot && i < units.length - 1 ? ' ' : null}
        </span>
      ))}
    </h1>
  )
}
