'use client'

/**
 * INCH” — "Text open" (from Figma Make prototype).
 * Scroll-driven: the ” splits into two strokes; the right stroke writes the
 * statement letter by letter (hard cuts, no fade). The statement is set as large as it can be
 * while staying clear of the header, so the header logo doesn't sink into the big type while
 * it is held.
 */
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { QuoteStroke, STROKE_GAP_RATIO, STROKE_RATIO } from '@/components/brand/Marks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useScrollProgress } from '@/hooks/useScrollProgress'

// Written by 62% of the zone's scroll (as before, about 0.87 screens), then held for about half a screen to be read.
const ANIM_END = 0.62
const DROP_END = 0.18
const DROP_PX = 48
const EXIT_UP = 40
const DRIFT_UP = 30 // the statement rises this much while it is written
const WIDTH_PER_FONT = 12.5 // container width ÷ font size
const MAX_FONT = 104
const MIN_FONT = 26
const LINE_HEIGHT = 1.28
/** Set a little tight, letters and words both. */
const TRACKING = '-0.025em'
const WORD_SPACING = '-0.04em'
/** The marks' distance from the text, in em: about the space between two of its letters. */
const LETTER_GAP = 0.03

/** The bottom of the header logo, with a little air under it. */
const headerBottom = () => (document.querySelector('[data-site-header] > a')?.getBoundingClientRect().bottom ?? 90) + 16

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** The zone's own length (vh) before any `holdVh`: written, then held, over its scroll of 140vh. */
const ZONE_VH = 240

/**
 * Pictures set into the statement (brand artboard 18): gaps held open in the text, a picture in
 * each that the writing opens left to right, like the letters (and closes again scrolling back).
 * Where they go, as shares of the way through the words: after "boutique" and "with a" in the
 * statement as written, and one more toward the end.
 */
const PIC_AT = [0.17, 0.5, 0.82]
/** How many letters' worth of the writing a picture takes to open. */
const PIC_STEPS = 3

/** The char indices the pictures sit before: the start of the word after each chosen share of the words. */
function picSlots(text: string, count: number) {
  const starts = [...text.matchAll(/\S+/g)].map((m) => m.index ?? 0)
  const slots = PIC_AT.slice(0, count).map((f) => starts[Math.min(starts.length - 1, Math.max(1, Math.round(f * starts.length)))])
  return [...new Set(slots)].filter((i) => i > 0)
}

/** `holdVh` keeps the written statement pinned for that much more scroll (something can play over it). `pics` opens in the text as it is written. */
export function TextOpen({ text, holdVh = 0, pics = [] }: { text: string; holdVh?: number; pics?: string[] }) {
  const reduced = useReducedMotion()
  const { ref: zoneRef, progress: rawProgress } = useScrollProgress<HTMLDivElement>()
  // The timeline runs over the zone's own scroll; any hold comes after it.
  const progress = reduced ? 1 : Math.min(1, (rawProgress * (ZONE_VH - 100 + holdVh)) / (ZONE_VH - 100))

  const slots = useMemo(() => picSlots(text, pics.length), [text, pics.length])
  const wrapRef = useRef<HTMLDivElement>(null)
  const picRefs = useRef<(HTMLSpanElement | null)[]>([])
  const textRef = useRef<HTMLParagraphElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [font, setFont] = useState(MAX_FONT)

  useEffect(() => {
    const el = wrapRef.current
    const t = textRef.current
    if (!el || !t) return
    // As large as the width allows, then smaller until the statement, centred and at its highest,
    // stays below the header: the height goes roughly with the square of the size (more lines too).
    const fit = (width: number) => {
      const room = Math.max(160, window.innerHeight - 2 * (headerBottom() + Math.max(DROP_PX, DRIFT_UP + EXIT_UP)))
      let f = Math.min(MAX_FONT, width / WIDTH_PER_FONT)
      const was = t.style.fontSize
      for (let i = 0; i < 4; i++) {
        t.style.fontSize = `${f}px`
        const h = t.offsetHeight
        if (h <= room) break
        f = Math.max(MIN_FONT, f * Math.sqrt(room / h) * 0.98)
      }
      t.style.fontSize = was
      setFont(f)
    }
    const ro = new ResizeObserver(([e]) => fit(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])


  const markH = Math.round(font * 0.42)
  const markW = Math.round(markH * STROKE_RATIO)
  const strokeGap = Math.round(markH * STROKE_GAP_RATIO)
  // The marks hang from the top of the capitals: 0.18em at line-height 1.1, plus half of the extra leading.
  const topNudge = Math.round(font * (0.18 + (LINE_HEIGHT - 1.1) / 2))
  // As far from the text as one letter is from the next.
  const sideGap = Math.round(font * LETTER_GAP)

  const animP = Math.min(1, progress / ANIM_END)
  const exitT = Math.max(0, (progress - ANIM_END) / (1 - ANIM_END))
  const dropT = Math.min(animP / DROP_END, 1)
  const splitT = easeOutCubic(dropT)
  const translateY = (1 - splitT) * -DROP_PX - animP * DRIFT_UP + exitT * -EXIT_UP
  const revealP = Math.max(0, (animP - DROP_END) / (1 - DROP_END))
  // The writing runs through the letters and the pictures alike: a picture takes PIC_STEPS letters'
  // worth of the scroll and opens left to right at the letters' pace, the stroke travelling across it.
  const units = text.length + PIC_STEPS * slots.length
  const u = reduced ? units : revealP * units
  let passed = 0
  let inPic = -1
  let picFrac = 0
  slots.forEach((at, k) => {
    const from = at + PIC_STEPS * k
    if (u >= from + PIC_STEPS) passed++
    else if (u >= from) [inPic, picFrac] = [k, (u - from) / PIC_STEPS]
  })
  const opened = (k: number) => (k < passed ? 1 : k === inPic ? picFrac : 0)
  // How many letters are written.
  const cursor = inPic >= 0 ? slots[inPic] : Math.min(text.length, Math.max(0, u - PIC_STEPS * passed))
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
    // Crossing a picture: the stroke rides its opening edge, on the line of the letter before it.
    if (inPic >= 0) {
      const pic = picRefs.current[inPic]
      const before = charRefs.current[Math.max(0, slots[inPic] - 1)]
      if (pic && before) {
        const pr = pic.getBoundingClientRect()
        place(pr.left - wr.left + picFrac * pr.width + sideGap, before.getBoundingClientRect().top - wr.top + topNudge, true)
        return
      }
    }
    // Fully open: the closing stroke stays put after the last character.
    if (reduced || leadIdx >= text.length - 1) {
      const last = charRefs.current[text.length - 1]
      if (!last) return
      const lr = last.getBoundingClientRect()
      place(lr.right - wr.left + sideGap, lr.top - wr.top + topNudge, true)
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
    <div ref={zoneRef} style={{ height: reduced ? 'auto' : `${ZONE_VH + holdVh}vh` }} className="relative">
      <div className={`${reduced ? 'py-32' : 'sticky top-0 h-dvh'} flex items-center justify-center overflow-hidden px-gutter`}>
        <div ref={wrapRef} className="relative w-[min(90vw,1500px)]" style={{ transform: `translateY(${translateY}px)` }}>
          <div aria-hidden className="pointer-events-none absolute" style={{ left: leftX, top: topNudge }}>
            <QuoteStroke side="left" height={markH} />
          </div>
          <div ref={rightRef} aria-hidden className="pointer-events-none absolute left-0 top-0 transition-opacity duration-100">
            <QuoteStroke side="right" height={markH} />
          </div>
          <p ref={textRef} className="m-0 font-bold" style={{ fontSize: font, lineHeight: LINE_HEIGHT, letterSpacing: TRACKING, wordSpacing: WORD_SPACING }} aria-label={text}>
            {text.split('').map((c, i) => {
              const k = slots.indexOf(i)
              return (
                <Fragment key={i}>
                  {k >= 0 && (
                    // The gap is always there (so the lines never reflow); the picture opens in it.
                    <span
                      aria-hidden
                      ref={(el) => {
                        picRefs.current[k] = el
                      }}
                      className="relative mx-[0.06em] mr-[0.28em] inline-block h-[0.74em] w-[1.25em] align-[-0.02em]"
                    >
                      <span className="absolute inset-0 overflow-hidden bg-line" style={{ clipPath: `inset(0 ${((1 - opened(k)) * 100).toFixed(2)}% 0 0)` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pics[k]} alt="" className="size-full object-cover grayscale" loading="lazy" />
                      </span>
                    </span>
                  )}
                  <span aria-hidden ref={(el) => { charRefs.current[i] = el }} style={{ opacity: i < cursor ? 1 : 0 }}>
                    {c}
                  </span>
                </Fragment>
              )
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
