'use client'

/**
 * INCH” — home hero (Figma "INCH” Brand" › hero storyboard).
 * 1. The ” blinks while the first video loads.
 * 2. It splits: a 3:4 video window opens between the strokes and grows,
 *    pushing them off-screen, until the video fills the screen.
 * 3. A giant INCH” types in top-left and the header types in over the video;
 *    a ruler wipes in along the bottom. The ruler is the carousel control for
 *    the hero videos (click a number / drag the tape / arrow keys). A video
 *    that ends hands over to the next.
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
const IMAGE_MS = 6000 // how long an image stays before the next item
const LOGO_W = 0.139 // giant logo font size as a share of viewport width (0.8 × the 770px-wide Figma logo @ 1920)
const HEADER_LOGO = 28 // px — the real header logo
const HEADER_TOP = 16 // px — header padding

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mod = (a: number, n: number) => ((a % n) + n) % n

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
  const vids = useRef<(HTMLVideoElement | null)[]>([])
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
  const placeLogo = () => {
    const el = logoRef.current
    if (!el) return
    const big = Math.min(window.innerWidth * LOGO_W, window.innerHeight * 0.27)
    const e = easeOut(Math.min(1, window.scrollY / (window.innerHeight * 0.45)))
    el.style.fontSize = `${big}px`
    el.style.left = `${window.innerWidth >= 768 ? 40 : 20}px`
    el.style.transform = `translateY(${lerp(window.innerHeight * 0.02, HEADER_TOP, e)}px) scale(${lerp(1, HEADER_LOGO / big, e)})`
  }
  useEffect(() => {
    if (!settled) return
    const on = () => {
      setStage(window.scrollY > window.innerHeight - 48 ? 'past' : 'over')
      placeLogo()
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [settled])
  useLayoutEffect(() => {
    if (stage === 'over') placeLogo()
  }, [stage])

  // Only the current video plays; each starts from the top when it comes up
  // (and the first one waits until the intro has opened it).
  const showVideo = stage !== 'intro' || skip
  useEffect(() => {
    vids.current.forEach((v, i) => {
      if (!v) return
      if (i === current && showVideo) {
        v.currentTime = 0
        v.play().catch(() => {})
      } else v.pause()
    })
  }, [current, showVideo])

  const step = (d: number) => N > 1 && setIdx((i) => i + d)

  // Images hand over to the next item after IMAGE_MS (videos do it when they end).
  const isImage = videos[current]?.kind === 'image'
  useEffect(() => {
    if (!showVideo || !isImage || N < 2) return
    const id = setTimeout(() => setIdx((i) => i + 1), IMAGE_MS)
    return () => clearTimeout(id)
  }, [idx, showVideo, isImage, N])

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
          const cls = 'absolute inset-0 size-full object-cover transition-opacity duration-700'
          return v.kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={v.src}
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
              ref={(el) => {
                vids.current[i] = el
              }}
              src={v.src}
              poster={v.poster}
              muted
              loop={N === 1}
              playsInline
              preload={i === 0 || i === mod(current + 1, N) ? 'auto' : 'metadata'}
              onCanPlay={i === 0 ? () => setReady(true) : undefined}
              onEnded={i === current ? () => step(1) : undefined}
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
          style={{ animation: 'hero-type 0.7s steps(5) both', lineHeight: 0.9 }}
        >
          <Logo as="div" className="whitespace-nowrap" />
        </div>
      )}

      {/* The ruler is the carousel control. */}
      {showUi && N > 0 && (
        <div className="absolute inset-x-0 bottom-0 pb-4 text-paper md:pb-6" style={{ animation: 'hero-wipe 0.8s var(--ease-out) 0.9s both' }}>
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
          />
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
