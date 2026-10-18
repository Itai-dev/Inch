'use client'

/**
 * A chapter told as a magazine, on the page itself. When it comes into view the closed magazine
 * slides in from a little to the side of the middle, tilted, and turns straight. Then the reader
 * turns the pages: a click or tap on the right page (or the cover) turns on, on the left page
 * back; also a swipe, or the buttons under it. The cover opens onto the chapter on the first
 * left page, then a model on every right page and her name on the page facing it. The pages
 * bend as they turn: each leaf is a row of thin strips, each turned a little further than the
 * one before, so the free edge leads and the page curls over. Scrolling just goes past it.
 * With reduced motion it is simply there and the pages change without turning.
 */
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Logo } from '@/components/brand/Logo'
import type { Division } from '@/sanity/lib/types'
export type Pic = { src: string; alt: string; credit?: string }

export type Spread = { name: string; pic: Pic }

const pad = (n: number) => String(n).padStart(2, '0')
const smooth = (p: number) => p * p * (3 - 2 * p)

function Folio({ n, side }: { n: number; side: 'left' | 'right' }) {
  return <span className={`absolute bottom-[4%] text-[clamp(7px,0.7vw,10px)] tabular-nums text-[#8a8883] ${side === 'left' ? 'left-[7%]' : 'right-[7%]'}`}>{n}</span>
}

function NamePage({ name, n }: { name: string; n: number }) {
  return (
    <div className="relative grid h-full place-items-center bg-[#fbfbfa]">
      <p className="text-[clamp(8px,1vw,14px)] uppercase tracking-[0.24em] text-[#2b2b2b]">{name}</p>
      <Folio n={n} side="left" />
    </div>
  )
}

function PhotoPage({ pic }: { pic: Pic }) {
  return (
    <div className="relative h-full overflow-hidden bg-line">
      <Image src={pic.src} alt={pic.alt} fill sizes="50vw" unoptimized={pic.src.endsWith('.svg')} className="object-cover grayscale contrast-[1.06]" />
    </div>
  )
}

/** The front cover: a full-bleed picture, the wordmark across the top, the issue at the foot. */
function CoverPage({ pic, division, number, heading }: { pic: Pic; division: Division; number: number; heading: string }) {
  return (
    <div className="relative h-full overflow-hidden bg-[#111]">
      <Image src={pic.src} alt="" fill sizes="50vw" unoptimized={pic.src.endsWith('.svg')} className="object-cover grayscale contrast-[1.06]" />
      <div className="absolute inset-0 flex flex-col justify-between p-[7%] text-white">
        <Logo division={division} as="div" className="w-full [&_svg]:!h-auto [&_svg]:!w-full" />
        <div className="flex items-end justify-between gap-4 text-[clamp(7px,0.75vw,11px)] uppercase tracking-[0.2em]">
          <span>No. {pad(number)}</span>
          <span>{heading}</span>
        </div>
      </div>
      {/* The cover's sheen. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgb(255_255_255/0.08),transparent_40%)]" />
    </div>
  )
}

/** The fold: pages darken a little toward the spine. */
const fold = (side: 'left' | 'right') =>
  `linear-gradient(to ${side === 'left' ? 'left' : 'right'}, rgb(0 0 0 / 0.14), rgb(0 0 0 / 0.03) 7%, transparent 16%)`

/** How many strips a leaf is cut into, and how far its free edge leads at the middle of a turn. */
const STRIPS = 18
const CURL = 70

/** One strip of a leaf, with the rest of the leaf hanging off its right edge (each turns on the one before). */
function Strip({ k, front, back }: { k: number; front: React.ReactNode; back: React.ReactNode }) {
  // Faces overlap the next strip by a pixel so no seam shows; the page inside stays aligned.
  const slice = (i: number) => ({ width: `calc(${STRIPS} * (100% - 1px))`, left: `calc(${-i} * (100% - 1px))` })
  return (
    <div
      data-strip
      className="absolute inset-y-0 origin-left [transform-style:preserve-3d]"
      style={k === 0 ? { left: 0, width: `${100 / STRIPS}%` } : { left: '100%', width: '100%' }}
    >
      <div className="absolute inset-y-0 left-0 w-[calc(100%+1px)] overflow-hidden [backface-visibility:hidden]">
        <div className="absolute inset-y-0" style={slice(k)}>{front}</div>
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 'var(--sf, 0)' }} />
      </div>
      <div className="absolute inset-y-0 left-0 w-[calc(100%+1px)] overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <div className="absolute inset-y-0" style={slice(STRIPS - 1 - k)}>{back}</div>
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 'var(--sb, 0)' }} />
      </div>
      {k + 1 < STRIPS && <Strip k={k + 1} front={front} back={back} />}
    </div>
  )
}

/** How long the closed magazine takes to arrive once it is in view, and a page to turn (ms). */
const ARRIVE_MS = 1100
const TURN_MS = 900
/** Where it starts, beside the middle: across (vw), down (share of its height) and tilt (deg). */
const FROM = { x: 14, y: 6, r: 8 }

export function Magazine({
  number,
  heading,
  text,
  brand,
  division,
  cover,
  spreads,
}: {
  number: number
  heading: string
  text: string
  brand: string
  division: Division
  cover: Pic
  spreads: Spread[]
}) {
  const section = useRef<HTMLElement>(null)
  const book = useRef<HTMLDivElement>(null)
  const shadow = useRef<HTMLSpanElement>(null)
  const spine = useRef<HTMLSpanElement>(null)
  const leaves = useRef<(HTMLDivElement | null)[]>([])
  // The cover is the first leaf; then one leaf per spread but the last.
  const turns = spreads.length
  // The page the reader asked for: 0 = closed, k = k leaves turned.
  const [page, setPage] = useState(0)
  /** Where the pages are now (they ease toward `page`), and how far the magazine has arrived. */
  const live = useRef({ at: 0, arrive: 0, draw: () => {}, frame: 0 })

  // Draws the book for the current state, straight on the DOM.
  useEffect(() => {
    const strips = leaves.current.map((leaf) => Array.from(leaf?.querySelectorAll<HTMLElement>('[data-strip]') ?? []))
    live.current.draw = () => {
      const { at, arrive: a } = live.current
      const arrive = smooth(a)
      const opened = smooth(Math.min(1, Math.max(0, (at - 0.15) / 0.7)))
      // Closed, the cover sits in the middle; open, the spine does.
      const b = book.current
      if (b) {
        const x = -25 * (1 - opened)
        b.style.transform = `translate(calc(${x.toFixed(2)}% + ${(FROM.x * (1 - arrive)).toFixed(2)}vw), ${(FROM.y * (1 - arrive)).toFixed(2)}%) rotate(${(FROM.r * (1 - arrive)).toFixed(2)}deg)`
        b.style.opacity = String(Math.min(1, a * 2.5))
      }
      if (shadow.current) shadow.current.style.left = `${(50 * (1 - opened) + 1).toFixed(2)}%`
      if (spine.current) spine.current.style.opacity = String(opened)
      leaves.current.forEach((leaf, k) => {
        if (!leaf) return
        // Each turn takes the middle of its stretch.
        const e = smooth(Math.min(1, Math.max(0, (at - k - 0.15) / 0.7)))
        // Turned pages pile on the left, the latest on top; the rest wait on the right, the next on top.
        leaf.style.zIndex = String(e > 0.5 ? 20 + k : 20 - k)
        // The page's angle at each strip: the free edge leads by up to CURL degrees mid-turn.
        const bend = Math.sin(Math.PI * e) * CURL
        let before = 0
        strips[k].forEach((strip, i) => {
          const angle = Math.min(180, 180 * e + bend * ((i + 1) / STRIPS) ** 1.6)
          strip.style.transform = `rotateY(${(before - angle).toFixed(2)}deg)` // relative to the strip before
          before = angle
          // Light from the front: the face shades a touch as it turns away.
          const c = Math.cos((angle * Math.PI) / 180)
          strip.style.setProperty('--sf', (0.05 * (1 - c)).toFixed(3))
          strip.style.setProperty('--sb', (0.04 * (1 + c)).toFixed(3))
        })
      })
    }
    live.current.draw()
  }, [turns])

  // It arrives (slides in and turns straight) once it is well in view.
  useEffect(() => {
    const el = section.current
    if (!el) return
    const l = live.current
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      l.arrive = 1
      l.draw()
      return
    }
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const from = performance.now()
        const tick = (now: number) => {
          l.arrive = Math.min(1, (now - from) / ARRIVE_MS)
          l.draw()
          if (l.arrive < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  // The pages ease toward the asked-for page; going back to the cover from far in flips through faster.
  useEffect(() => {
    const l = live.current
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      l.at = page
      l.draw()
      return
    }
    cancelAnimationFrame(l.frame)
    const from = l.at
    const ms = TURN_MS * Math.max(1, Math.sqrt(Math.abs(page - from)))
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      l.at = from + (page - from) * p
      l.draw()
      if (p < 1) l.frame = requestAnimationFrame(tick)
    }
    l.frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(l.frame)
  }, [page])

  // On from the last page closes the magazine again.
  const step = (d: number) => setPage((p) => (p + d > turns ? 0 : Math.max(0, p + d)))
  const swipe = useRef({ x: 0, y: 0, moved: false })

  if (!spreads.length) return null
  // Each leaf's two faces: the cover over the chapter, then a model over the next one's name.
  const faces: { front: React.ReactNode; back: React.ReactNode }[] = [
    {
      front: <CoverPage pic={cover} division={division} number={number} heading={heading} />,
      back: (
        <div className="relative h-full overflow-hidden bg-[#fbfbfa]">
          <div className="flex h-full flex-col p-[9%] text-[#0a0a0a]">
            <p className="text-[clamp(7px,0.75vw,11px)] uppercase tracking-[0.2em] text-[#6f6f6f]">{brand} — {pad(number)}</p>
            <h3 className="wordmark mt-auto text-[clamp(26px,4.2vw,68px)] uppercase leading-[0.85]">{heading}</h3>
            <p className="mt-[6%] max-w-[34ch] text-[clamp(9px,1.05vw,15px)] leading-snug">{text}</p>
          </div>
          <Folio n={2} side="left" />
        </div>
      ),
    },
    ...spreads.slice(0, -1).map((s, k) => ({
      front: <PhotoPage pic={s.pic} />,
      back: <NamePage name={spreads[k + 1].name} n={4 + k * 2} />,
    })),
  ]
  return (
    <section ref={section} aria-label={`${pad(number)} ${heading}`} aria-roledescription="carousel" className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-[clamp(20px,3vh,36px)] overflow-hidden py-[clamp(40px,6vh,80px)]">
      <div
        ref={book}
        className="relative cursor-pointer select-none will-change-transform"
        style={{ width: 'min(92vw, 100dvh)', aspectRatio: '3 / 2', perspective: '2600px', transform: `translate(calc(-25% + ${FROM.x}vw), ${FROM.y}%) rotate(${FROM.r}deg)`, opacity: 0, touchAction: 'pan-y' }}
        onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY, moved: false })}
        onPointerUp={(e) => {
          const dx = e.clientX - swipe.current.x
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - swipe.current.y)) {
            swipe.current.moved = true
            step(dx < 0 ? 1 : -1)
          }
        }}
        onClick={(e) => {
          if (swipe.current.moved) return
          // Closed, a click anywhere opens it; open, the left page goes back and the right one on.
          const r = e.currentTarget.getBoundingClientRect()
          step(page === 0 || e.clientX > r.left + r.width / 2 ? 1 : -1)
        }}
      >
        {/* The book's shadow on the floor: under the cover while closed, under both pages once open. */}
        <span ref={shadow} aria-hidden className="absolute inset-y-[2%] left-[51%] right-[1%] bg-black/25 blur-2xl" style={{ bottom: '-2%' }} />

        {/* Last right page: the last model, under all the leaves. */}
        <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
          <PhotoPage pic={spreads[spreads.length - 1].pic} />
          <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: fold('right') }} />
        </div>

        {/* The leaves, each cut into strips that bend. */}
        {faces.map((f, k) => (
          <div
            key={k}
            ref={(n) => {
              leaves.current[k] = n
            }}
            className="absolute inset-y-0 right-0 w-1/2 [transform-style:preserve-3d]"
            style={{ zIndex: 20 - k }}
          >
            <Strip
              k={0}
              front={
                <>
                  {f.front}
                  {k > 0 && <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: fold('right') }} />}
                </>
              }
              back={
                <>
                  {f.back}
                  <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: fold('left') }} />
                </>
              }
            />
          </div>
        ))}

        {/* The spine, once open. */}
        <span ref={spine} aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-50 w-px -translate-x-1/2 bg-black/20" style={{ opacity: 0 }} />
      </div>

      {/* Back | where you are | on. */}
      <div className="label flex items-center gap-6 tabular-nums">
        <button type="button" onClick={() => step(-1)} disabled={page === 0} className="hover:opacity-60 disabled:opacity-25">
          ← Back
        </button>
        <span aria-live="polite" className="min-w-[7ch] text-center text-muted">
          {page === 0 ? 'Cover' : `${pad(page)} / ${pad(turns)}`}
        </span>
        <button type="button" onClick={() => step(1)} className="hover:opacity-60">
          {page === 0 ? 'Open →' : page === turns ? 'Close' : 'Next →'}
        </button>
      </div>
    </section>
  )
}
