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
 * `opening="grow"` (on /logotest) replaces step 2: the ” grows in one movement, ever faster,
 * the video fading in inside it, into its left stroke until the video fills the screen.
 * The stage is exposed as `data-hero` so globals.css can restyle the header.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Logo } from '@/components/brand/Logo'
import { LEFT_PATH, QuoteMark, QuoteStroke, RIGHT_PATH, STROKE_GAP_RATIO } from '@/components/brand/Marks'
import { SKIP_HERO_LOADER } from '@/components/SiteSwitchLink'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Ruler } from './Ruler'

export type HeroMedia = { kind: 'video' | 'image'; src: string; poster?: string }
type Stage = 'intro' | 'open' | 'over' | 'past'

const MARK_VH = 0.065 // ” height at rest, as a share of viewport height (70px @ 1080) — keep in sync with the 6.5dvh loader mark
const DOT_VH = 0.045 // DOT.'s blinking ■, as a share of viewport height
const WIN_VH = 0.316 // first video window height (341px @ 1080)
const STROKE = 0.206 // stroke height ÷ window height
const STROKE_GAP = 0.02 // gap between window and stroke ÷ window height (kept tight to the video)
const BLINK_MS = 900 // one blink, as the text cursor's: on half the time, off half, hard cuts; the open always starts at the top of one
const MIN_BLINKS = 2 // even when the video is cached
const MAX_WAIT_MS = 4000 // open anyway if the video is slow
const OPEN_MS = 2400
const GROW_MS = 2100 // the "grow" opening: one movement, ever faster, until the video fills the screen
const GROW_FADE = [0.3, 0.7] // the video fades in inside the ” (share of GROW_MS)…
const GROW_INTO = [15.7 / 64, 16.3 / 72] // …as it grows into the solid top of its left stroke (share of the mark)
const GROW_SQUARE = [28.6 / 64, 32.7 / 72] // size of that solid part (share of the mark)
const MARK_MASK = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 72"><path d="${LEFT_PATH}"/><path d="${RIGHT_PATH}"/></svg>`)}")`
const SPLIT = 0.25
const SLIDE_MS = 6000 // each item stays this long, then the next pushes it out
const PUSH_MS = 1300
const PUSH_EASE = 'cubic-bezier(0.45, 0, 0.25, 1)' // soft ease in-out
// Hand-off after the reveal (t = 0 when the video has finished growing):
const LOGO_LEAD_MS = 250 // logo starts growing this long before the video stops, so the motion carries on
const LOGO_IN_MS = 1400 // …and lands at +1.15s; the menu types in from +0.4s (globals.css)
const RULER_IN_MS = 1000 // ruler blinks in at +1s…
const RULER_STEP_MS = 1400 // …and moves on one item as it arrives, to show what it does
const LOGO_EASE = 'cubic-bezier(0.2, 0.6, 0.2, 1)' // starts moving, then settles
const LOGO_W = 0.139 // giant logo font size as a share of viewport width (0.8 × the 770px-wide Figma logo @ 1920)
// The real header (keep in sync with Header.tsx): logo font size, top and side padding.
const headerLogo = () => (window.innerWidth >= 768 ? 70 : 48)
const headerTop = () => Math.min(40, Math.max(12, window.innerWidth * 0.021))
const headerSide = () => Math.min(46, Math.max(20, window.innerWidth * 0.024))

// Coming back from DOT.: no blinking loader, start straight at the video reveal.
const readSkipLoader = () => {
  try {
    return sessionStorage.getItem(SKIP_HERO_LOADER) === '1'
  } catch {
    return false
  }
}

// Set once the intro has played: in module memory (in-site navigation) and for the browser
// session (sessionStorage), so coming back to the home page by any route (from DOT., a model,
// the application, a reload, a link) shows the hero already open; only the first visit of a
// session gets the loader, the video opening and the logo arriving.
let introPlayed = false
const INTRO_PLAYED = 'inch:intro-played'
const readIntroPlayed = () => {
  if (introPlayed) return true
  try {
    return sessionStorage.getItem(INTRO_PLAYED) === '1'
  } catch {
    return false
  }
}
const markIntroPlayed = () => {
  introPlayed = true
  try {
    sessionStorage.setItem(INTRO_PLAYED, '1')
  } catch {}
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

export function QuoteVideoHero({ videos, opening: openWith = 'split', division = 'women' }: { videos: HeroMedia[]; opening?: 'split' | 'grow'; division?: 'women' | 'men' }) {
  // DOT.: the same hero, with its ■ for the ” (the window grows out of it) and its own logo.
  const dot = division === 'men'
  const grow = openWith === 'grow' && !dot
  const N = videos.length
  const reduced = useReducedMotion()
  const [stage, setStage] = useState<Stage>('intro')
  // False on the server and while hydrating, then the session's truth (a re-render before paint, as `fast`).
  const seen = useSyncExternalStore(() => () => {}, readIntroPlayed, () => false)
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

  // The blink, hard on and off like a text cursor (on the compositor, so loading work can't make it stutter).
  useEffect(() => {
    if (seen) {
      try {
        sessionStorage.removeItem(SKIP_HERO_LOADER) // not needed: the intro is skipped entirely
      } catch {}
      return
    }
    if (reduced || fast) return
    blinkAnim.current =
      blinkRef.current?.animate(
        [
          { opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.5 },
          { opacity: 0, offset: 0.5 },
          { opacity: 0, offset: 1 },
        ],
        { duration: BLINK_MS, iterations: Infinity },
      ) ?? null
    const a = setTimeout(() => setWaited(true), BLINK_MS * MIN_BLINKS)
    const b = setTimeout(() => setReady(true), MAX_WAIT_MS)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [reduced, fast, seen])

  const skip = reduced || seen // no loader / reveal / intro choreography
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

  // DOT.: the window starts as the blinking ■ and grows to full screen, height leading width.
  const layoutDot = (p: number) => {
    const win = winRef.current
    if (!win) return
    const W = window.innerWidth
    const H = window.innerHeight
    const s0 = H * DOT_VH
    win.style.width = `${s0 + (W - s0) * easeInOut(p)}px`
    win.style.height = `${s0 + (H - s0) * easeInOut(Math.min(1, p / 0.8))}px`
    // The ■ grows as itself, and the video comes up through it softly as it does.
    win.style.setProperty('--cover', String(1 - smooth(Math.max(0, Math.min(1, (p - 0.08) / 0.8)))))
  }

  // The "grow" opening: the video, full screen, seen through the ” as it grows (mask size and
  // place), with a black cover over the video that lifts so it fades in inside the mark.
  const layoutGrow = (p: number) => {
    const win = winRef.current
    if (!win) return
    // The stage's own size (not the window's, which counts a scrollbar), so the ” starts
    // exactly where the blinking one was centred.
    const W = win.clientWidth
    const H = win.clientHeight
    const mh0 = H * MARK_VH
    const mw0 = (mh0 * 64) / 72
    const sEnd = Math.max((W * 1.15) / (mw0 * GROW_SQUARE[0]), (H * 1.15) / (mh0 * GROW_SQUARE[1]))
    // One movement, ever faster: exponential growth, and the exponent itself accelerating.
    const s = sEnd ** (p ** 1.7)
    const mw = mw0 * s
    const mh = mh0 * s
    // Grows from its middle and drifts into its left stroke, which comes to the middle of the screen.
    // The drift follows the growth (not the clock), so the mark never slides before it has grown.
    const into = (s - 1) / (sEnd - 1)
    const ax = lerp(0.5, GROW_INTO[0], into)
    const ay = lerp(0.5, GROW_INTO[1], into)
    win.style.setProperty('--mw', `${mw}px`)
    win.style.setProperty('--mh', `${mh}px`)
    win.style.setProperty('--mx', `${W / 2 - ax * mw}px`)
    win.style.setProperty('--my', `${H / 2 - ay * mh}px`)
    const f = easeOut(Math.max(0, Math.min(1, (p - GROW_FADE[0]) / (GROW_FADE[1] - GROW_FADE[0]))))
    win.style.setProperty('--cover', String(1 - f))
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
      const draw = dot ? layoutDot : grow ? layoutGrow : layout
      const total = grow ? GROW_MS : OPEN_MS
      draw(0)
      setStage('open')
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / total)
        draw(p)
        if (now - t0 >= total - LOGO_LEAD_MS) setLogoIn(true)
        if (p < 1) raf = requestAnimationFrame(tick)
        else {
          done = true
          markIntroPlayed()
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
  }, [opening, grow, dot])

  const settled = skip || stage === 'over' || stage === 'past'

  // Once open: the header sits over the video until it has scrolled away, and the
  // giant logo shrinks into the header position on the way.
  useEffect(() => {
    if (!settled) return
    const on = () => {
      setStage(window.scrollY > window.innerHeight - 72 ? 'past' : 'over')
      placeLogo(logoRef.current)
      // The header and logo are plain white at the top; the inverse (difference) effect starts with
      // the first scroll.
      if (rootRef.current) rootRef.current.dataset.scrolled = window.scrollY > 0 ? '1' : '0'
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
    if (stage !== 'over' || rulerDemoDone.current || N < 2 || skip) return
    rulerDemoDone.current = true
    const id = setTimeout(() => setIdx((i) => i + 1), RULER_STEP_MS)
    return () => clearTimeout(id)
  }, [stage, N, skip])

  // After the first arrival has played (menu typed in), scrolling back up doesn't replay it.
  useEffect(() => {
    if (stage !== 'over') return
    const id = setTimeout(() => {
      if (rootRef.current) rootRef.current.dataset.introDone = '1'
    }, 2000)
    return () => clearTimeout(id)
  }, [stage])
  // Also whenever the stage changes: the logo is taken down once the video has scrolled away and
  // put back when it comes up again (a jump to the top, say), and the new element has to be placed
  // at once, not on the next scroll event (else it stands there at the header's size, unplaced).
  useLayoutEffect(() => {
    if (!showLogo) return
    const el = logoRef.current
    const big = placeLogo(el)
    if (!el || !big || logoIntroDone.current) return
    logoIntroDone.current = true
    if (skip) return
    el.animate(
      [
        { opacity: 0, transform: logoTransform(big, 1) },
        { opacity: 1, transform: el.style.transform },
      ],
      { duration: LOGO_IN_MS, easing: LOGO_EASE },
    )
  }, [showLogo, skip, stage])

  // Only the current video plays; each starts from the top when it comes up
  // (and the first one waits until the intro has opened it).
  const showVideo = stage !== 'intro' || skip
  // Sound: on unless turned off, and only while the video is on screen. Browsers only let a page
  // play sound once it has been touched, so until then the video plays silently and the first
  // tap, click or key anywhere turns the sound on.
  const [soundOn, setSoundOn] = useState(true)
  const [audible, setAudible] = useState(false)
  const unlocked = useRef(false)
  const wantSound = soundOn && stage !== 'past'
  const sync = useCallback(() => {
    const v = els.current[current]
    if (!(v instanceof HTMLVideoElement)) return setAudible(false)
    const on = wantSound && unlocked.current
    v.muted = !on
    setAudible(on && !v.paused)
  }, [current, wantSound])
  useEffect(() => {
    els.current.forEach((v, i) => {
      if (!(v instanceof HTMLVideoElement)) return
      if (i === current && showVideo) {
        v.currentTime = 0
        // With sound if the browser allows it; else silently, until the first touch.
        v.muted = !wantSound
        v.play()
          .then(() => {
            if (!v.muted) unlocked.current = true
            sync()
          })
          .catch(() => {
            v.muted = true
            v.play().catch(() => {})
            sync()
          })
      } else v.pause()
    })
    // Only a new video restarts playback; sound changes are applied by sync below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, showVideo])
  useEffect(() => {
    sync()
  }, [sync])
  useEffect(() => {
    const touch = (e: Event) => {
      // The sound button decides for itself.
      if ((e.target as Element | null)?.closest?.('[data-sound]')) return
      unlocked.current = true
      sync()
    }
    addEventListener('pointerdown', touch, { passive: true })
    addEventListener('keydown', touch)
    return () => {
      removeEventListener('pointerdown', touch)
      removeEventListener('keydown', touch)
    }
  }, [sync])

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
      // Skipping the intro still hands over to the header logo once the video has scrolled away.
      data-hero={skip ? (stage === 'past' ? 'past' : 'over') : stage}
      data-intro-done={seen ? '1' : undefined}
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
          <div>
            {/* Sized in CSS (dvh), not from JS, so it's right from the first frame — no jump on load. */}
            <span ref={blinkRef} className="block [&>svg]:h-[6.5dvh] [&>svg]:w-auto">
              {dot ? <span className="block size-[4.5dvh] bg-fg" /> : <QuoteMark />}
            </span>
          </div>
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
          // "grow": full screen from the start, seen through the growing ”.
          ...(grow && !settled
            ? {
                width: '100%',
                height: '100%',
                maskImage: MARK_MASK,
                WebkitMaskImage: MARK_MASK,
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskSize: 'var(--mw) var(--mh)',
                WebkitMaskSize: 'var(--mw) var(--mh)',
                maskPosition: 'var(--mx) var(--my)',
                WebkitMaskPosition: 'var(--mx) var(--my)',
              }
            : null),
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
              key={`${i}-${v.src}`}
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
              key={`${i}-${v.src}`}
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
        {/* "grow": the ” is black until the video fades in inside it. */}
        {(grow || dot) && !settled && <div aria-hidden className="absolute inset-0 bg-fg" style={{ opacity: 'var(--cover, 1)' }} />}
      </div>
      {!settled && !grow && !dot && (
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
          <Logo as="div" division={division} className="whitespace-nowrap" />
        </div>
      )}

      {/* The ruler is the carousel control. */}
      {showUi && N > 0 && (
        <div className="absolute inset-x-0 bottom-0 pb-[clamp(16px,2.97vw,57px)] text-paper" style={{ animation: seen ? undefined : `hero-blink 0.4s steps(1, end) ${RULER_IN_MS}ms both` }}>
          <div ref={rulerRef} className="relative">
            {/* Sound on / off, over the ruler's right end. */}
            {videos.some((v) => v.kind === 'video') && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  unlocked.current = true
                  if (audible) setSoundOn(false)
                  else {
                    setSoundOn(true)
                    // Straight away, inside the tap, so the browser lets it play.
                    const v = els.current[current]
                    if (v instanceof HTMLVideoElement) {
                      v.muted = false
                      v.play().catch(() => {})
                      setAudible(true)
                    }
                  }
                }}
                data-sound
                aria-pressed={audible}
                aria-label={audible ? 'Sound off' : 'Sound on'}
                className="absolute bottom-[calc(100%+clamp(10px,1.4vw,22px))] right-[var(--gutter)] -m-2 flex items-center gap-2 p-2 text-[clamp(12px,0.9vw,15px)] font-bold uppercase leading-none"
                style={{ fontStretch: '80%' }}
              >
                <SoundIcon on={audible} />
                {audible ? 'Sound on' : 'Sound off'}
              </button>
            )}
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

/** A speaker, with its waves when the sound is on, crossed out when it is off. */
function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[1.4em]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}
    </svg>
  )
}
