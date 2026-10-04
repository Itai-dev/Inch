'use client'

/**
 * INCH” — "Text open" (from Figma Make prototype).
 * Scroll-driven: the ” splits into two strokes; the right stroke travels with
 * a character-by-character fade-in reveal of the statement.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { QuoteStroke, STROKE_GAP_RATIO, STROKE_RATIO } from '@/components/brand/Marks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useScrollProgress } from '@/hooks/useScrollProgress'

const FADE_CHARS = 18
const ANIM_END = 0.78
const DROP_END = 0.18
const DROP_PX = 48
const EXIT_UP = 70
const WIDTH_PER_FONT = 1214 / 81.37 // container width ÷ font size in the prototype
const MAX_FONT = 72

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function TextOpen({ text }: { text: string }) {
  const reduced = useReducedMotion()
  const { ref: zoneRef, progress: rawProgress } = useScrollProgress<HTMLDivElement>()
  const progress = reduced ? 1 : rawProgress

  const wrapRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [font, setFont] = useState(MAX_FONT)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setFont(Math.min(MAX_FONT, e.contentRect.width / WIDTH_PER_FONT * 1.0)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const markH = Math.round(font * 0.42)
  const markW = Math.round(markH * STROKE_RATIO)
  const strokeGap = Math.round(markH * STROKE_GAP_RATIO)
  const topNudge = Math.round(font * 0.18)
  const sideGap = Math.round(font * 0.13)

  const animP = Math.min(1, progress / ANIM_END)
  const exitT = Math.max(0, (progress - ANIM_END) / (1 - ANIM_END))
  const dropT = Math.min(animP / DROP_END, 1)
  const splitT = easeOutCubic(dropT)
  const translateY = (1 - splitT) * -DROP_PX - animP * 60 + exitT * -EXIT_UP
  const revealP = Math.max(0, (animP - DROP_END) / (1 - DROP_END))
  const cursor = reduced ? text.length + FADE_CHARS : revealP * (text.length + FADE_CHARS)
  const leadIdx = Math.min(text.length - 1, Math.max(0, Math.floor(cursor)))
  const leftX = -(markW + sideGap)

  // Position the travelling stroke imperatively (no re-render per frame).
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const right = rightRef.current
    if (!wrap || !right) return
    const wr = wrap.getBoundingClientRect()
    const place = (x: number, y: number, visible: boolean) => {
      right.style.transform = `translate(${x}px, ${y}px)`
      right.style.opacity = visible ? '1' : '0'
    }
    const first = charRefs.current[0]
    if (splitT < 1 || cursor <= 0) {
      const firstRight = first ? first.getBoundingClientRect().right - wr.left + sideGap : sideGap
      const start = leftX + markW + strokeGap
      place(lerp(start, firstRight, splitT), topNudge, true)
      return
    }
    if (reduced || leadIdx >= text.length - 1) {
      place(0, 0, false)
      return
    }
    const lead = charRefs.current[leadIdx]
    if (!lead) return
    const lr = lead.getBoundingClientRect()
    const next = charRefs.current[leadIdx + 1]
    const newRow = next ? Math.abs(next.getBoundingClientRect().top - lr.top) > 4 : false
    if (newRow) place(lr.right - wr.left + sideGap, lr.top - wr.top + topNudge, false)
    else place(lr.right - wr.left + sideGap, lr.top - wr.top + topNudge, true)
  })

  return (
    <div ref={zoneRef} style={{ height: reduced ? 'auto' : '210vh' }} className="relative">
      <div className={`${reduced ? 'py-32' : 'sticky top-0 h-dvh'} flex items-center justify-center overflow-hidden px-6`}>
        <div ref={wrapRef} className="relative w-[min(86vw,1214px)]" style={{ transform: `translateY(${translateY}px)` }}>
          <div aria-hidden className="pointer-events-none absolute" style={{ left: leftX, top: topNudge }}>
            <QuoteStroke side="left" height={markH} />
          </div>
          <div ref={rightRef} aria-hidden className="pointer-events-none absolute left-0 top-0 transition-opacity duration-100">
            <QuoteStroke side="right" height={markH} />
          </div>
          <p className="m-0 font-bold" style={{ fontSize: font, lineHeight: 1.1 }} aria-label={text}>
            {text.split('').map((c, i) => (
              <span
                key={i}
                aria-hidden
                ref={(el) => { charRefs.current[i] = el }}
                style={{ opacity: Math.min(1, Math.max(0, (cursor - i) / FADE_CHARS)) }}
              >
                {c}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  )
}
