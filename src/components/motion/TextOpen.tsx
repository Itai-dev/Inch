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

// Moved, split and written by 78% of the zone's scroll, then held to be read.
const ANIM_END = 0.78
/** First the ” comes up from under the video, a little larger, to the middle of the screen. Then,
 * with the scroll, it moves slowly to the left, shrinking to its size, to the statement's start
 * (MOVE_FROM to MOVE_END of the writing: about half a screen of scrolling), then splits (to DROP_END).
 * It stays at the middle of the screen's height the whole way: the statement starts there and
 * runs down from it, the block rising as it is written until it sits centred. */
const MARK_BIG = 2.2
const MOVE_FROM = 0.03
const MOVE_END = 0.4
const DROP_END = 0.48
const EXIT_UP = 40
const AIR = 48 // kept clear above and below the written statement (its exit, and room to breathe)
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
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** The zone's own length (vh) before any `holdVh`: moved, written, then held, over its scroll of 170vh. */
const ZONE_VH = 270

/**
 * Pictures set into the statement (brand artboard 18): gaps held open in the text, a picture in
 * each that the writing opens left to right, like the letters (and closes again scrolling back).
 * Where they go, as shares of the way through the words: after "boutique" and "with a" in the
 * statement as written, and one more toward the end.
 */
const PIC_AT = [0.17, 0.5, 0.82]
/** Each picture's shape: the first two upright, the last across. */
const PIC_UPRIGHT = [true, true, false]
/** How many letters' worth of the writing a picture takes to open: about its width in letters, so it opens at their pace. */
const picSteps = (k: number) => (PIC_UPRIGHT[k] ? 2 : 3)

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
  const leftRef = useRef<HTMLDivElement>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [font, setFont] = useState(MAX_FONT)

  useEffect(() => {
    const el = wrapRef.current
    const t = textRef.current
    if (!el || !t) return
    // As large as the width allows, then smaller until the statement, centred and at its highest,
    // stays below the header: the height goes roughly with the square of the size (more lines too).
    const fit = (width: number) => {
      const room = Math.max(160, window.innerHeight - 2 * (headerBottom() + AIR))
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
  const moveE = easeInOutCubic(clamp01((animP - MOVE_FROM) / (MOVE_END - MOVE_FROM)))
  const splitT = easeOutCubic(clamp01((animP - MOVE_END) / (DROP_END - MOVE_END)))
  const revealP = Math.max(0, (animP - DROP_END) / (1 - DROP_END))
  // The writing runs through the letters and the pictures alike: a picture takes picSteps letters'
  // worth of the scroll and opens left to right at the letters' pace, the stroke travelling across it.
  const units = text.length + slots.reduce((n, _, k) => n + picSteps(k), 0)
  const u = reduced ? units : revealP * units
  let passed = 0
  let inPic = -1
  let picFrac = 0
  let before = 0 // the pictures' steps before this one
  let stepsPassed = 0
  slots.forEach((at, k) => {
    const from = at + before
    const n = picSteps(k)
    if (u >= from + n) {
      passed++
      stepsPassed += n
    } else if (u >= from) [inPic, picFrac] = [k, (u - from) / n]
    before += n
  })
  const opened = (k: number) => (k < passed ? 1 : k === inPic ? picFrac : 0)
  // How many letters are written.
  const cursor = inPic >= 0 ? slots[inPic] : Math.min(text.length, Math.max(0, u - stepsPassed))
  const leadIdx = Math.min(text.length - 1, Math.max(0, Math.floor(cursor)))
  const leftX = -(markW + sideGap)

  // Position the travelling stroke imperatively (no re-render per frame).
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const right = rightRef.current
    const left = leftRef.current
    if (!wrap || !right || !left) return
    // The block starts with its first line at the middle of the screen (where the ” arrives), and
    // rises as the statement is written, until it sits centred; then it leaves upward.
    const lift = wrap.offsetHeight / 2 - topNudge - markH / 2
    wrap.style.transform = `translateY(${(reduced ? 0 : lift * (1 - clamp01(revealP))) - exitT * EXIT_UP}px)`
    const wr = wrap.getBoundingClientRect()
    const place = (x: number, y: number, visible: boolean, scale = 1) => {
      right.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
      right.style.opacity = visible ? '1' : '0'
    }
    // Arriving: the whole ”, larger, in the middle of the screen, moving left with the scroll to the
    // statement's start and shrinking about its own centre on the way, at the same height throughout.
    if (moveE < 1 && !reduced) {
      const s = lerp(MARK_BIG, 1, moveE)
      const markFull = markW * 2 + strokeGap
      const cx = lerp(wrap.offsetWidth / 2, leftX + markFull / 2, moveE)
      const cy = topNudge + markH / 2
      const x = cx - (s * markFull) / 2
      const y = cy - (s * markH) / 2
      left.style.transform = `translate(${x}px, ${y}px) scale(${s})`
      place(x + (markW + strokeGap) * s, y, true, s)
      return
    }
    left.style.transform = `translate(${leftX}px, ${topNudge}px)`
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
    // Without a hold, phones get a shorter zone (210vh), so the statement doesn't take a long thumb to get past.
    <div ref={zoneRef} style={{ height: reduced ? 'auto' : holdVh ? `${ZONE_VH + holdVh}vh` : undefined }} className={`relative ${reduced || holdVh ? '' : 'h-[210vh] md:h-[270vh]'}`}>
      <div className={`${reduced ? 'py-32' : 'sticky top-0 h-dvh'} flex items-center justify-center overflow-hidden px-gutter`}>
        {/* Placed from the layout effect below (its lift, then its exit). */}
        <div ref={wrapRef} className="relative w-[min(90vw,1500px)]">
          <div ref={leftRef} aria-hidden className="pointer-events-none absolute left-0 top-0 origin-top-left">
            <QuoteStroke side="left" height={markH} />
          </div>
          <div ref={rightRef} aria-hidden className="pointer-events-none absolute left-0 top-0 origin-top-left transition-opacity duration-100">
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
                      // Upright: from the descenders to the top of the capitals; across: the capitals' height.
                      className={`relative mx-[0.06em] mr-[0.28em] inline-block ${PIC_UPRIGHT[k] ? 'h-[0.92em] w-[0.69em] align-[-0.2em]' : 'h-[0.74em] w-[1.25em] align-[-0.02em]'}`}
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
