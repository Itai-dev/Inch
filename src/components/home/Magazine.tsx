'use client'

/**
 * A chapter told as a magazine, on the page itself, right under the statement. The closed
 * magazine first shows its spine, lying across ("INCH” Model Management 2026"), and turns with
 * the scroll to face you with its cover, upright, as it rises to the middle of the screen: a
 * solid box, cover, spine and the pages' edges, shading as it turns, with its shadow under it. Then the reader
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

/** The opening, as a share of its scroll: the spine rests until here, then the magazine turns to its cover. And a page to turn (ms). */
const TURN_FROM = 0.22
const TURN_MS = 900
/** The book's width, the closed magazine's (the cover's) width and height, and its thickness. */
const BOOK_W = 'min(92vw, 100dvh)'
const COVER_W = `(${BOOK_W} / 2)`
const COVER_H = `(${BOOK_W} / 1.5)`
const SPINE_T = `(${BOOK_W} * 0.036)`
const css = (expr: string) => `calc(${expr})`

/** The pages' edges, as seen on the side of a closed magazine: fine lines across its thickness. */
const paper = (dir: 'right' | 'bottom') => `repeating-linear-gradient(to ${dir}, #f6f4ef 0 1px, #e4e0d8 1px 2px)`

/**
 * The closed magazine as a solid box — cover, spine and the pages' edges — for the opening only
 * (the real book takes over once it faces you). Faces carry a shade that the opening sets as they
 * turn toward or away from the light (in front).
 */
function ClosedBook({ boxRef, cover, division, number, heading }: { boxRef: React.Ref<HTMLDivElement>; cover: Pic; division: Division; number: number; heading: string }) {
  const half = css(`${SPINE_T} / 2`)
  return (
    <div
      ref={boxRef}
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/4 w-1/2 [transform-style:preserve-3d]"
      style={{ transform: 'rotateZ(-90deg) rotateY(90deg)' }}
    >
      {/* Cover. */}
      <div className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: `translateZ(${half})` }}>
        <CoverPage pic={cover} division={division} number={number} heading={heading} />
        <span data-shade="cover" className="absolute inset-0 bg-black" style={{ opacity: 0 }} />
      </div>
      {/* The pages' edges: top, bottom and the side opposite the spine. */}
      <div className="absolute inset-x-0 [backface-visibility:hidden]" style={{ height: css(SPINE_T), top: css(`${SPINE_T} / -2`), transform: 'rotateX(90deg)', backgroundImage: paper('bottom') }} />
      <div className="absolute inset-x-0 [backface-visibility:hidden]" style={{ height: css(SPINE_T), bottom: css(`${SPINE_T} / -2`), transform: 'rotateX(-90deg)', backgroundImage: paper('bottom') }} />
      <div className="absolute inset-y-0 [backface-visibility:hidden]" style={{ width: css(SPINE_T), right: css(`${SPINE_T} / -2`), transform: 'rotateY(90deg)', backgroundImage: paper('right') }} />
      {/* The spine, on the cover's left edge, a little rounded by the light. */}
      <div
        className="absolute inset-y-0 overflow-hidden bg-[#121212] text-white [backface-visibility:hidden]"
        style={{ width: css(SPINE_T), left: css(`${SPINE_T} / -2`), transform: 'rotateY(-90deg)' }}
      >
        {/* Laid out lengthwise, then turned onto the spine: it reads left to right once the magazine lies across. */}
        <div
          className="absolute left-1/2 top-1/2 flex items-center justify-between"
          style={{ width: css(COVER_H), height: css(SPINE_T), padding: `0 ${css(SPINE_T)}`, transform: 'translate(-50%, -50%) rotate(90deg)' }}
        >
          {/* The logo, a little under half the spine's thickness tall, as far in from the end as the spine is thick. */}
          <span className="flex" style={{ fontSize: css(`${SPINE_T} * 0.625`) }}>
            <Logo division={division} />
          </span>
          <span className="whitespace-nowrap uppercase tracking-[0.32em]" style={{ fontSize: css(`${SPINE_T} * 0.26`) }}>
            Model Management
          </span>
          <span className="whitespace-nowrap tabular-nums tracking-[0.2em]" style={{ fontSize: css(`${SPINE_T} * 0.26`) }}>
            {new Date().getFullYear()}
          </span>
        </div>
        <span aria-hidden className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgb(0 0 0 / 0.35), rgb(255 255 255 / 0.08) 45%, rgb(255 255 255 / 0.04) 60%, rgb(0 0 0 / 0.4))' }} />
        <span data-shade="spine" className="absolute inset-0 bg-black" style={{ opacity: 0 }} />
      </div>
    </div>
  )
}

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
  const box = useRef<HTMLDivElement>(null)
  const boxShadow = useRef<HTMLSpanElement>(null)
  // The cover is the first leaf; then one leaf per spread but the last.
  const turns = spreads.length
  // The page the reader asked for: 0 = closed, k = k leaves turned.
  const [page, setPage] = useState(0)
  /** Where the pages are now (they ease toward `page`), and how far the magazine has arrived. */
  const live = useRef({ at: 0, arrive: 0, done: false, draw: () => {}, frame: 0 })

  // Draws the book for the current state, straight on the DOM.
  useEffect(() => {
    const strips = leaves.current.map((leaf) => Array.from(leaf?.querySelectorAll<HTMLElement>('[data-strip]') ?? []))
    live.current.draw = () => {
      const { at, arrive: a } = live.current
      const opened = smooth(Math.min(1, Math.max(0, (at - 0.15) / 0.7)))
      // The opening: the spine lies across (there as soon as you scroll to it), then the box turns upright to its cover.
      const turn = smooth(Math.min(1, Math.max(0, (a - TURN_FROM) / (1 - TURN_FROM))))
      const deg = 90 * (1 - turn)
      const sin = Math.sin((deg * Math.PI) / 180)
      const cos = Math.cos((deg * Math.PI) / 180)
      const bx = box.current
      if (bx) {
        bx.style.opacity = a >= 1 ? '0' : '1'
        bx.style.transform = `rotateZ(${(-deg).toFixed(2)}deg) rotateY(${deg.toFixed(2)}deg)`
        // Light from in front: a face darkens as it turns away.
        const shade = (k: string, v: number) => bx.querySelector<HTMLElement>(`[data-shade="${k}"]`)?.style.setProperty('opacity', v.toFixed(3))
        shade('spine', 0.6 * (1 - sin))
        shade('cover', 0.5 * (1 - cos))
      }
      // Its shadow: the outline it shows (the spine's, widening to the cover's), turned with it, a little down and to the right.
      const sh = boxShadow.current
      if (sh) {
        sh.style.opacity = a >= 1 ? '0' : '1'
        sh.style.width = css(`${COVER_W} * ${(0.96 * cos).toFixed(4)} + ${SPINE_T} * ${sin.toFixed(4)}`)
        sh.style.height = css(COVER_H)
        sh.style.transform = `translate(-50%, -50%) translate(${css(`${COVER_W} * 0.02`)}, ${css(`${COVER_H} * 0.02`)}) rotate(${(-deg).toFixed(2)}deg)`
      }
      // Closed, the cover sits in the middle; open, the spine does. The real book shows once the box faces you.
      const b = book.current
      if (b) {
        b.style.transform = `translateX(${(-25 * (1 - opened)).toFixed(2)}%)`
        b.style.opacity = a >= 1 ? '1' : '0'
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

  // The opening follows the scroll: the spine comes up from below, and the magazine turns to its
  // cover as it rises to the middle of the screen (and back, scrolling up). Once the reader has
  // opened it, or clicked during the opening, it stays a book.
  useEffect(() => {
    const el = section.current?.firstElementChild
    if (!el) return
    const l = live.current
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      l.arrive = 1
      l.draw()
      return
    }
    let raf = 0
    const read = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const mid = r.top + r.height / 2
        const from = innerHeight * 1.05 // its middle just under the screen
        const to = innerHeight * 0.52 // its middle in the middle
        const p = Math.min(1, Math.max(0, (from - mid) / (from - to)))
        const a = l.done || l.at > 0 ? 1 : p
        if (a === l.arrive) return
        l.arrive = a
        l.draw()
      })
    }
    read()
    addEventListener('scroll', read, { passive: true })
    addEventListener('resize', read)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', read)
      removeEventListener('resize', read)
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
  const step = (d: number) => {
    // Turning a page ends the opening at once.
    const l = live.current
    l.done = true
    if (l.arrive < 1) {
      l.arrive = 1
      l.draw()
    }
    setPage((p) => (p + d > turns ? 0 : Math.max(0, p + d)))
  }
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
    <section ref={section} aria-label={`${pad(number)} ${heading}`} aria-roledescription="carousel" className="relative flex flex-col items-center gap-[clamp(20px,3vh,36px)] overflow-hidden pb-[clamp(56px,8vh,112px)] pt-[clamp(16px,3vh,40px)] motion-safe:-mt-[16vh]">
      <div
        className="relative cursor-pointer select-none"
        style={{ width: BOOK_W, aspectRatio: '3 / 2', perspective: '2600px', touchAction: 'pan-y' }}
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
          // During the opening, a click skips to the cover.
          const l = live.current
          if (l.arrive < 1) {
            l.done = true
            l.arrive = 1
            l.draw()
            return
          }
          // Closed, a click anywhere opens it; open, the left page goes back and the right one on.
          const r = e.currentTarget.getBoundingClientRect()
          step(page === 0 || e.clientX > r.left + r.width / 2 ? 1 : -1)
        }}
      >
        {/* The closed magazine's shadow on the floor, following its outline as it turns. */}
        <span ref={boxShadow} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 bg-black/25 blur-2xl" />
        <ClosedBook boxRef={box} cover={cover} division={division} number={number} heading={heading} />
        <div ref={book} className="absolute inset-0 will-change-transform" style={{ perspective: '2600px', transform: 'translateX(-25%)', opacity: 0 }}>
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
