'use client'

/**
 * INCH” — home hero (Figma "INCH” Brand" › hero storyboard).
 * 1. The ” blinks while the first video loads.
 * 2. It splits: a 3:4 video window opens between the strokes and grows,
 *    pushing them off-screen, until the video fills the screen.
 * 3. A giant INCH” fades and grows in top-left and the header types in over the video;
 *    a ruler fades in along the bottom (and fades out as you scroll). The ruler is the carousel control for
 *    the hero items (click a number / arrow keys). Every 6 s
 *    the next item pushes the current one out sideways.
 * 4. Scrolling moves the video up; the giant logo shrinks into the header.
 * The stage is exposed as `data-hero` so globals.css can restyle the header.
 */
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Logo } from '@/components/brand/Logo'
import { QuoteMark, QuoteStroke, STROKE_GAP_RATIO } from '@/components/brand/Marks'
import { SKIP_HERO_LOADER } from '@/components/SiteSwitchLink'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Ruler } from './Ruler'

export type HeroMedia = { kind: 'video' | 'image'; src: string; poster?: string }
type Stage = 'intro' | 'open' | 'over' | 'past'

const MARK_VH = 0.065 // ” height at rest, as a share of viewport height (70px @ 1080)
const WIN_VH = 0.316 // first video window height (341px @ 1080)
const STROKE = 0.206 // stroke height ÷ window height
const STROKE_GAP = 0.02 // gap between window and stroke ÷ window height (kept tight to the video)
const BLINK_MS = 1200 // one smooth blink; the open always starts at the top of a blink
const MIN_BLINKS = 2 // even when the video is cached
const MAX_WAIT_MS = 4000 // open anyway if the video is slow
const OPEN_MS = 2400
const SPLIT = 0.25
const SLIDE_MS = 6000 // each item stays this long, then the next pushes it out
const PUSH_MS = 1300
const PUSH_EASE = 'cubic-bezier(0.45, 0, 0.25, 1)' // soft ease in-out
// Hand-off after the reveal (t = 0 when the video has finished growing):
const LOGO_LEAD_MS = 250 // logo starts growing this long before the video stops, so the motion carries on
const LOGO_IN_MS = 1400 // …and lands at +1.15s; the menu types in from +0.4s (globals.css)
const RULER_IN_MS = 1000 // ruler fades in from +1s…
const RULER_STEP_MS = 1400 // …and moves on one item as it arrives, to show what it does
const LOGO_EASE = 'cubic-bezier(0.2, 0.6, 0.2, 1)' // starts moving, then settles
const LOGO_W = 0.139 // giant logo font size as a share of viewport width (0.8 × the 770px-wide Figma logo @ 1920)
// The real header (keep in sync with Header.tsx): logo font size, top and side padding.
const headerLogo = () => (window.innerWidth >= 768 ? 70 : 48)
const headerTop = () => Math.min(57, Math.max(16, window.innerWidth * 0.0297))
const headerSide = () => Math.min(46, Math.max(20, window.innerWidth * 0.024))

// Coming back from DOT.: no blinking loader, start straight at the video reveal.
const readSkipLoader = () => {
  try {
    return sessionStorage.getItem(SKIP_HERO_LOADER) === '1'
  } catch {
    return false
  }
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mod = (a: number, n: number) => ((a % n) + n) % n

// Giant logo: big at the top of the page, shrinking into the header logo as you scroll.
const logoTransform = (big: number, e: number) =>
  `translateY(${lerp(window.innerHeight * 0.02, headerTop(), e)}px) scale(${lerp(1, headerLogo() / big, e)})`
function placeLogo(el: HTMLElement | null) {
  if (!el) return 0
  const big = Math.min(window.innerWidth * LOGO_W, window.innerHeight * 0.27)
  const e = easeOut(Math.min(1, window.scrollY / (window.innerHeight * 0.45)))
  el.style.fontSize = `${big}px`
  el.style.left = `${headerSide()}px`
  el.style.transform = logoTransform(big, e)
  return big
}

export function QuoteVideoHero({ videos }: { videos: HeroMedia[] }) {
  const N = videos.length
  const reduced = useReducedMotion()
  const [stage, setStage] = useState<Stage>('intro')
  const [vp, setVp] = useState({ w: 1440, h: 900 })
  const [ready, setReady] = useState(N === 0)
  const [waited, setWaited] = useState(false)
  const [logoIn, setLogoIn] = useState(false)
  const fast = useSyncExternalStore(() => () => {}, readSkipLoader, () => false)
  const [idx, setIdx] = useState(0) // unbounded, so the ruler always slides forward
  const current = N ? mod(idx, N) : 0
  const els = useRef<(HTMLVideoElement | HTMLImageElement | null)[]>([])
  const rulerRef = useRef<HTMLDivElement>(null)
  const prevIdx = useRef(0)
  const logoRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLElement>(null)
  const blinkRef = useRef<HTMLSpanElement>(null)
  const winRef = useRef<HTMLDivElement>(null)
  const strokesRef = useRef<HTMLDivElement>(null)
  const blinkAnim = useRef<Animation | null>(null)

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  // Smooth blink (on the compositor, so loading work can't make it stutter).
  useEffect(() => {
    if (reduced || fast) return
    blinkAnim.current =
      blinkRef.current?.animate([{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], {
        duration: BLINK_MS,
        iterations: Infinity,
        easing: 'ease-in-out',
      }) ?? null
    const a = setTimeout(() => setWaited(true), BLINK_MS * MIN_BLINKS)
    const b = setTimeout(() => setReady(true), MAX_WAIT_MS)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [reduced, fast])

  const skip = reduced
  const opening = !skip && (fast || (ready && waited)) // flips true once, starts the open

  // Reveal, drawn frame by frame straight onto the DOM (no React render per frame).
  // Phase 1 (SPLIT): the ” splits as a window opens between its strokes.
  // Phase 2: the window grows to full screen, height leading width; strokes ride its edges.
  const layout = (p: number) => {
    const win = winRef.current
    const strokes = strokesRef.current
    if (!win) return
    const W = window.innerWidth
    const H = window.innerHeight
    const h0 = H * WIN_VH
    const w0 = h0 * 0.75
    const a = smooth(Math.min(1, p / SPLIT))
    const b = Math.max(0, (p - SPLIT) / (1 - SPLIT))
    const winH = h0 + (H - h0) * easeInOut(Math.min(1, b / 0.8))
    const winW = w0 * a + (W - w0) * easeInOut(b)
    win.style.width = `${winW}px`
    win.style.height = `${winH}px`
    if (!strokes) return
    const strokeH = Math.max(H * MARK_VH, winH * STROKE)
    // Strokes start exactly where they sit in the ” and part as the window opens.
    const gap = lerp((H * MARK_VH * STROKE_GAP_RATIO) / 2, winH * STROKE_GAP, a)
    const [l, r] = strokes.children as unknown as HTMLElement[]
    strokes.style.setProperty('--h', `${strokeH}px`)
    l.style.right = `${winW / 2 + gap}px`
    r.style.left = `${winW / 2 + gap}px`
  }

  const openedRef = useRef(false)
  useEffect(() => {
    if (!opening || openedRef.current) return
    openedRef.current = true
    let raf = 0
    let done = false
    // Start at the top of a blink so the ” never jumps from half-faded.
    const t = blinkAnim.current?.currentTime
    const wait = typeof t === 'number' ? (BLINK_MS - (t % BLINK_MS)) % BLINK_MS : 0
    const timer = setTimeout(() => {
      blinkAnim.current?.cancel()
      layout(0)
      setStage('open')
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / OPEN_MS)
        layout(p)
        if (now - t0 >= OPEN_MS - LOGO_LEAD_MS) setLogoIn(true)
        if (p < 1) raf = requestAnimationFrame(tick)
        else {
          done = true
          setStage('over')
          try {
            sessionStorage.removeItem(SKIP_HERO_LOADER) // the skip is used up once fully open
          } catch {}
        }
      }
      raf = requestAnimationFrame(tick)
    }, wait)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      if (!done) openedRef.current = false // interrupted (e.g. dev double-mount): allow a restart
    }
  }, [opening])

  const settled = skip || stage === 'over' || stage === 'past'

  // Once open: the header sits over the video until it has scrolled away, and the
  // giant logo shrinks into the header position on the way.
  useEffect(() => {
    if (!settled) return
    const on = () => {
      setStage(window.scrollY > window.innerHeight - 72 ? 'past' : 'over')
      placeLogo(logoRef.current)
      // The inverse (difference) effect on the header and logo only kicks in once you scroll.
      if (rootRef.current) rootRef.current.dataset.scrolled = window.scrollY > 2 ? '1' : '0'
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
  const showLogo = stage === 'over' || logoIn
  // As the ruler arrives, it moves on one item (pushing the next video in) to show it's the control.
  const rulerDemoDone = useRef(false)
  useEffect(() => {
    if (stage !== 'over' || rulerDemoDone.current || N < 2 || reduced) return
    rulerDemoDone.current = true
    const id = setTimeout(() => setIdx((i) => i + 1), RULER_STEP_MS)
    return () => clearTimeout(id)
  }, [stage, N, reduced])

  // After the first arrival has played (menu typed in), scrolling back up doesn't replay it.
  useEffect(() => {
    if (stage !== 'over') return
    const id = setTimeout(() => {
      if (rootRef.current) rootRef.current.dataset.introDone = '1'
    }, 2000)
    return () => clearTimeout(id)
  }, [stage])
  useLayoutEffect(() => {
    if (!showLogo) return
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
      { duration: LOGO_IN_MS, easing: LOGO_EASE },
    )
  }, [showLogo, reduced])

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

  const showUi = stage === 'over' || stage === 'past'

  // Ruler scales with the viewport (60px per number @ 1920 — 0.75 × the Figma ruler).
  const rs = Math.min(1, Math.max(0.6, vp.w / 1920))

  return (
    <section
      ref={rootRef}
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
      {!showVideo && !fast && (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <span ref={blinkRef}>
            <QuoteMark height={Math.round(vp.h * MARK_VH)} />
          </span>
        </div>
      )}

      {/* 2–3. Video window grows between the two strokes, then fills the screen. */}
      <div
        ref={winRef}
        className="absolute left-1/2 top-1/2 overflow-hidden bg-ink"
        style={{
          transform: 'translate(-50%, -50%)',
          visibility: showVideo ? 'visible' : 'hidden',
          ...(settled ? { width: '100%', height: '100%' } : null),
        }}
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
      {!settled && (
        <div
          ref={strokesRef}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{ visibility: stage === 'open' ? 'visible' : 'hidden' }}
        >
          <div className="absolute top-0 -translate-y-1/2 [&>svg]:h-[var(--h)] [&>svg]:w-auto">
            <QuoteStroke side="left" />
          </div>
          <div className="absolute top-0 -translate-y-1/2 [&>svg]:h-[var(--h)] [&>svg]:w-auto">
            <QuoteStroke side="right" />
          </div>
        </div>
      )}

      {/* Giant logo (shrinks into the header on scroll) — fixed, so it can land on the header logo. */}
      {showLogo && stage !== 'past' && (
        <div
          ref={logoRef}
          aria-hidden
          className="hero-logo pointer-events-none fixed top-0 z-30 origin-top-left text-paper"
          style={{ lineHeight: 0.9 }}
        >
          <Logo as="div" className="whitespace-nowrap" />
        </div>
      )}

      {/* The ruler is the carousel control. */}
      {showUi && N > 0 && (
        <div className="absolute inset-x-0 bottom-0 pb-[clamp(16px,2.97vw,57px)] text-paper" style={{ animation: `hero-fade 0.8s var(--ease-out) ${RULER_IN_MS}ms both` }}>
          <div ref={rulerRef}>
            <Ruler
              count={N}
              pos={idx}
              active={[current]}
              onSelect={setIdx}
              reduced={reduced}
              segW={Math.round(60 * rs)}
              fontPx={Math.max(12, Math.round(21 * rs))}
              tickH={Math.round(26 * rs)}
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
