'use client'

/**
 * INCH” — home hero (Figma "INCH” Brand" › hero storyboard).
 * 1. The ” blinks while the first video loads.
 * 2. It splits: a 3:4 video window opens between the strokes and grows,
 *    pushing them off-screen, until the video fills the screen.
 * 3. A giant INCH” fades and grows in top-left and the header types in over the video;
 *    a ruler fades in along the bottom (and fades out as you scroll). The ruler is the carousel control for
 *    the hero items (click a number / drag the tape / arrow keys). Every 6 s
 *    the next item pushes the current one out sideways.
 * 4. Scrolling moves the video up; the giant logo shrinks into the header.
 * The stage is exposed as `data-hero` so globals.css can restyle the header.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Logo } from '@/components/brand/Logo'
import { QuoteMark, QuoteStroke } from '@/components/brand/Marks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Ruler } from './Ruler'

export type HeroMedia = { kind: 'video' | 'image'; src: string; poster?: string }
type Stage = 'intro' | 'open' | 'over' | 'past'

const MARK_VH = 0.065 // ” height at rest, as a share of viewport height (70px @ 1080)
const WIN_VH = 0.316 // first video window height (341px @ 1080)
const STROKE = 0.206 // stroke height ÷ window height
const STROKE_GAP = 0.06 // gap between window and stroke ÷ window height
const MIN_BLINK_MS = 1300 // at least two blinks, even when the video is cached
const MAX_WAIT_MS = 4000 // open anyway if the video is slow
const OPEN_MS = 2000
const SPLIT = 0.22
const SLIDE_MS = 6000 // each item stays this long, then the next pushes it out
const PUSH_MS = 1300
const PUSH_EASE = 'cubic-bezier(0.83, 0, 0.17, 1)' // strong ease in-out: slow start, slow settle
const LOGO_IN_MS = 1400
const LOGO_W = 0.139 // giant logo font size as a share of viewport width (0.8 × the 770px-wide Figma logo @ 1920)
const HEADER_LOGO = 35 // px — the real header logo (keep in sync with Header.tsx)
const HEADER_TOP = 16 // px — header padding

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mod = (a: number, n: number) => ((a % n) + n) % n

// Giant logo: big at the top of the page, shrinking into the header logo as you scroll.
const logoTransform = (big: number, e: number) =>
  `translateY(${lerp(window.innerHeight * 0.02, HEADER_TOP, e)}px) scale(${lerp(1, HEADER_LOGO / big, e)})`
function placeLogo(el: HTMLElement | null) {
  if (!el) return 0
  const big = Math.min(window.innerWidth * LOGO_W, window.innerHeight * 0.27)
  const e = easeOut(Math.min(1, window.scrollY / (window.innerHeight * 0.45)))
  el.style.fontSize = `${big}px`
  el.style.left = `${window.innerWidth >= 768 ? 40 : 20}px`
  el.style.transform = logoTransform(big, e)
  return big
}

export function QuoteVideoHero({ videos }: { videos: HeroMedia[] }) {
  const N = videos.length
  const reduced = useReducedMotion()
  const [stage, setStage] = useState<Stage>('intro')
  const [t, setT] = useState(0)
  const [vp, setVp] = useState({ w: 1440, h: 900 })
  const [ready, setReady] = useState(N === 0)
  const [waited, setWaited] = useState(false)
  const [idx, setIdx] = useState(0) // unbounded, so the ruler always slides forward
  const current = N ? mod(idx, N) : 0
  const els = useRef<(HTMLVideoElement | HTMLImageElement | null)[]>([])
  const rulerRef = useRef<HTMLDivElement>(null)
  const prevIdx = useRef(0)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  // Blink for a minimum time, then open once the first video can play (or we give up waiting).
  useEffect(() => {
    const a = setTimeout(() => setWaited(true), MIN_BLINK_MS)
    const b = setTimeout(() => setReady(true), MAX_WAIT_MS)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])

  const skip = reduced
  const opening = !skip && ready && waited // flips true once, starts the open

  useEffect(() => {
    if (!opening) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / OPEN_MS)
      setT(p)
      setStage(p < 1 ? 'open' : 'over')
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [opening])

  const settled = skip || stage === 'over' || stage === 'past'

  // Once open: the header sits over the video until it has scrolled away, and the
  // giant logo shrinks into the header position on the way.
  useEffect(() => {
    if (!settled) return
    const on = () => {
      setStage(window.scrollY > window.innerHeight - 48 ? 'past' : 'over')
      placeLogo(logoRef.current)
      // The ruler fades out over the first quarter screen of scrolling.
      const r = rulerRef.current
      if (r) {
        const o = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.25))
        r.style.opacity = String(o)
        r.style.pointerEvents = o < 0.1 ? 'none' : ''
      }
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [settled])
  // First arrival: the logo fades in while growing from header size — the scroll shrink, reversed.
  const logoIntroDone = useRef(false)
  useLayoutEffect(() => {
    if (stage !== 'over') return
    const el = logoRef.current
    const big = placeLogo(el)
    if (!el || !big || logoIntroDone.current) return
    logoIntroDone.current = true
    if (reduced) return
    el.animate(
      [
        { opacity: 0, transform: logoTransform(big, 1) },
        { opacity: 1, transform: el.style.transform },
      ],
      { duration: LOGO_IN_MS, easing: PUSH_EASE },
    )
  }, [stage, reduced])

  // Only the current video plays; each starts from the top when it comes up
  // (and the first one waits until the intro has opened it).
  const showVideo = stage !== 'intro' || skip
  useEffect(() => {
    els.current.forEach((v, i) => {
      if (!(v instanceof HTMLVideoElement)) return
      if (i === current && showVideo) {
        v.currentTime = 0
        v.play().catch(() => {})
      } else v.pause()
    })
  }, [current, showVideo])

  const step = (d: number) => N > 1 && setIdx((i) => i + d)

  // Every SLIDE_MS the next item pushes the current one out (a manual pick restarts the clock).
  useEffect(() => {
    if (!showVideo || N < 2) return
    const id = setTimeout(() => setIdx((i) => i + 1), SLIDE_MS)
    return () => clearTimeout(id)
  }, [idx, showVideo, N])

  // Push: the incoming item slides in from the side we're moving towards, shoving the old one out.
  // Layout effect so the animation is in place before the browser paints the new item (no blink).
  useLayoutEffect(() => {
    const from = prevIdx.current
    prevIdx.current = idx
    if (from === idx || reduced || !N) return
    const out = els.current[mod(from, N)]
    const inn = els.current[mod(idx, N)]
    if (!out || !inn || out === inn) return
    const dir = idx > from ? 1 : -1
    const opts = { duration: PUSH_MS, easing: PUSH_EASE }
    inn.animate([{ transform: `translateX(${dir * 100}%)`, opacity: 1 }, { transform: 'translateX(0)', opacity: 1 }], opts)
    out.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${-dir * 100}%)`, opacity: 1 }], opts)
  }, [idx, N, reduced])

  const p = skip ? 1 : t
  // Window: the ” splits and a 3:4 window opens between the strokes (first SPLIT of
  // the time), then it grows — height fills first, then width — ending full-bleed.
  const h0 = vp.h * WIN_VH
  const w0 = h0 * 0.75
  const a = Math.min(1, p / SPLIT)
  const b = Math.max(0, (p - SPLIT) / (1 - SPLIT))
  const winH = h0 + (vp.h - h0) * easeOut(b)
  const winW = b > 0 ? w0 + (vp.w - w0) * easeInOut(b) : w0 * easeOut(a)
  const strokeH = Math.max(vp.h * MARK_VH, winH * STROKE)
  const gap = winH * STROKE_GAP
  const showUi = stage === 'over' || stage === 'past'

  // Ruler scales with the viewport (56px per number @ 1920 — 0.7 × the Figma ruler).
  const rs = Math.min(1, Math.max(0.6, vp.w / 1920))

  return (
    <section
      data-hero={skip ? 'over' : stage}
      className="relative h-dvh overflow-hidden bg-bg"
      aria-roledescription="carousel"
      aria-label="INCH”"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') step(1)
        if (e.key === 'ArrowLeft') step(-1)
      }}
    >
      {/* 1. Blinking ” while loading. */}
      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <span style={{ animation: 'hero-blink 0.65s steps(1) infinite' }}>
            <QuoteMark height={Math.round(vp.h * MARK_VH)} />
          </span>
        </div>
      )}

      {/* 2–3. Video window grows between the two strokes, then fills the screen. */}
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden bg-ink"
        style={{ width: winW, height: winH, transform: 'translate(-50%, -50%)', visibility: showVideo ? 'visible' : 'hidden' }}
      >
        {videos.map((v, i) => {
          const style = { opacity: i === current ? 1 : 0 }
          const cls = 'absolute inset-0 size-full object-cover'
          const ref = (el: HTMLVideoElement | HTMLImageElement | null) => {
            els.current[i] = el
          }
          return v.kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={v.src}
              ref={ref}
              src={v.src}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              onLoad={i === 0 ? () => setReady(true) : undefined}
              aria-hidden={i !== current}
              className={cls}
              style={style}
            />
          ) : (
            <video
              key={v.src}
              ref={ref}
              src={v.src}
              poster={v.poster}
              muted
              loop
              playsInline
              preload={i === 0 || i === mod(current + 1, N) ? 'auto' : 'metadata'}
              onCanPlay={i === 0 ? () => setReady(true) : undefined}
              aria-hidden={i !== current}
              className={cls}
              style={style}
            />
          )
        })}
      </div>
      {stage === 'open' && (
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2" style={{ height: strokeH }}>
          <div className="absolute top-0" style={{ right: winW / 2 + gap, transform: 'translateY(-50%)' }}>
            <QuoteStroke side="left" height={strokeH} />
          </div>
          <div className="absolute top-0" style={{ left: winW / 2 + gap, transform: 'translateY(-50%)' }}>
            <QuoteStroke side="right" height={strokeH} />
          </div>
        </div>
      )}

      {/* Giant logo (shrinks into the header on scroll) — fixed, so it can land on the header logo. */}
      {stage === 'over' && (
        <div
          ref={logoRef}
          aria-hidden
          className="pointer-events-none fixed top-0 z-30 origin-top-left text-paper"
          style={{ lineHeight: 0.9 }}
        >
          <Logo as="div" className="whitespace-nowrap" />
        </div>
      )}

      {/* The ruler is the carousel control. */}
      {showUi && N > 0 && (
        <div className="absolute inset-x-0 bottom-0 pb-4 text-paper md:pb-6" style={{ animation: 'hero-fade 0.8s var(--ease-out) 0.9s both' }}>
          <div ref={rulerRef}>
            <Ruler
              count={N}
              pos={idx}
              active={[current]}
              onSelect={setIdx}
              reduced={reduced}
              segW={Math.round(56 * rs)}
              fontPx={Math.max(11, Math.round(19 * rs))}
              tickH={Math.round(24 * rs)}
              minors={9}
              duration={PUSH_MS}
              easing={PUSH_EASE}
            />
          </div>
        </div>
      )}
      {N > 1 && (
        <div className="sr-only">
          <p aria-live="polite">{`${current + 1} of ${N}`}</p>
          <button type="button" onClick={() => step(-1)}>Previous</button>
          <button type="button" onClick={() => step(1)}>Next</button>
        </div>
      )}
    </section>
  )
}
