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
import { rulerTicks, SEG_OVERLAP } from '@/lib/ruler'
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

/** The page corners away from the spine are a little rounded, as on a printed magazine. */
const RADIUS = 'clamp(2px, 0.22vw, 3.5px)'
/** The spine's corners, and the cover's where it wraps onto it: rounder, as the bound edge is. */
const SPINE_R = 'clamp(3px, 0.45vw, 7px)'

/** Coated paper: a soft band of light across the page, sliding with the mouse (--gx on the stage). */
function Gloss({ strength = 0.16 }: { strength?: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(112deg, transparent calc(var(--gx, 38%) - 26%), rgb(255 255 255 / ${strength}) var(--gx, 38%), transparent calc(var(--gx, 38%) + 22%)), linear-gradient(to bottom, rgb(255 255 255 / ${strength * 0.45}), transparent 35%)`,
      }}
    />
  )
}

function PhotoPage({ pic }: { pic: Pic }) {
  return (
    <div className="relative h-full overflow-hidden bg-line">
      <Image src={pic.src} alt={pic.alt} fill sizes="50vw" unoptimized={pic.src.endsWith('.svg')} className="object-cover grayscale contrast-[1.06]" />
      <Gloss strength={0.045} />
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
      {/* The cover's gloss. */}
      <Gloss strength={0.08} />
    </div>
  )
}

/** The fold: pages darken a little toward the spine. */
const fold = (side: 'left' | 'right') =>
  `linear-gradient(to ${side === 'left' ? 'left' : 'right'}, rgb(0 0 0 / 0.14), rgb(0 0 0 / 0.03) 7%, transparent 16%)`

/**
 * The cover's hinge: a crease pressed in a little way from the spine (a dark line with the light
 * catching its far lip), and the strip between it and the spine rounding away into shade, as a
 * cover does where it wraps round. `side` is the side the spine is on.
 */
function Hinge({ side, strength = 1 }: { side: 'left' | 'right'; strength?: number }) {
  const dir = side === 'left' ? 'to right' : 'to left'
  const at = '3.2%'
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: strength,
        backgroundImage: [
          // The crease: in shadow, then its lip in the light.
          `linear-gradient(${dir}, transparent ${at}, rgb(0 0 0 / 0.3) ${at}, rgb(0 0 0 / 0.3) calc(${at} + 1px), rgb(255 255 255 / 0.28) calc(${at} + 1px), rgb(255 255 255 / 0.28) calc(${at} + 2px), transparent calc(${at} + 2px))`,
          // The cover rounding over onto the spine: darker toward the edge, a soft highlight just before the crease.
          `linear-gradient(${dir}, rgb(0 0 0 / 0.32), rgb(0 0 0 / 0.08) 1.2%, rgb(255 255 255 / 0.07) 2.4%, transparent ${at})`,
          // A faint dip just past the crease, where the board bends.
          `linear-gradient(${dir}, transparent calc(${at} + 2px), rgb(0 0 0 / 0.07) calc(${at} + 4px), transparent 6.5%)`,
        ].join(','),
      }}
    />
  )
}

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
      <div className="absolute inset-y-0 left-0 w-[calc(100%+1px)] overflow-hidden [backface-visibility:hidden]" style={k === STRIPS - 1 ? { borderTopRightRadius: RADIUS, borderBottomRightRadius: RADIUS } : undefined}>
        <div className="absolute inset-y-0" style={slice(k)}>{front}</div>
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 'var(--sf, 0)' }} />
      </div>
      {/* (Turned over, its left side is the leaf's free edge.) */}
      <div className="absolute inset-y-0 left-0 w-[calc(100%+1px)] overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]" style={k === STRIPS - 1 ? { borderTopLeftRadius: RADIUS, borderBottomLeftRadius: RADIUS } : undefined}>
        <div className="absolute inset-y-0" style={slice(STRIPS - 1 - k)}>{back}</div>
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 'var(--sb, 0)' }} />
      </div>
      {k + 1 < STRIPS && <Strip k={k + 1} front={front} back={back} />}
    </div>
  )
}

/**
 * While the section is pinned, its scroll (0–1) plays the opening, then opens the cover:
 * - until INTRO_END, the opening: the spine holds, large and close, until TURN_FROM of it; the
 *   magazine turns to its cover and sinks onto the surface until TURN_TO of it; then rests;
 * - from OPEN_FROM to OPEN_TO, the cover opens onto the first spread; then it rests open.
 * Once the reader turns a page themselves, the scroll leaves the pages alone. The section is
 * 380vh tall (pinned for 280vh of scroll); on phones 220vh, so it doesn't take a long thumb to get past.
 */
const INTRO_END = 0.55
const TURN_FROM = 0.3
const TURN_TO = 0.82
const OPEN_FROM = 0.64
const OPEN_TO = 0.9
/** How much bigger the spine is when it's close (at most; it also stays inside the screen). */
const CLOSE = 1.9
/** A page to turn (ms). */
const TURN_MS = 900
/** The book's width, the closed magazine's (the cover's) width and height, and its thickness. */
const BOOK_W = 'min(94vw, 100dvh)'
const COVER_H = `(${BOOK_W} / 1.5)`
const SPINE_T = `(${BOOK_W} * 0.036)`
const css = (expr: string) => `calc(${expr})`
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** The tape between the arrows: an inch a spread (00 the cover), seen through a window a little wider than an inch, with blank inches before and after. */
const INCH_PX = 120
/** The window's width: a little wider than an inch, narrower on phones so the arrows keep their room. */
const TAPE_WIN = 'min(200px, 34vw)'
const TAPE_FROM = -2

/** A long, thin arrow. */
function Arrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 64 24" aria-hidden className="block h-[clamp(24px,3.6vw,46px)] w-auto" style={dir === 'left' ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M1 12h60M50 2l11 10-11 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}



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
      <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden]" style={{ transform: `translateZ(${half})`, borderRadius: `${SPINE_R} ${RADIUS} ${RADIUS} ${SPINE_R}` }}>
        <CoverPage pic={cover} division={division} number={number} heading={heading} />
        <Hinge side="left" />
        <span data-shade="cover" className="absolute inset-0 bg-black" style={{ opacity: 0 }} />
        {/* The light catching the glossy cover as it turns toward you. */}
        <span
          data-glare
          className="absolute inset-0"
          style={{ opacity: 0, backgroundImage: 'linear-gradient(118deg, transparent 38%, rgb(255 255 255 / 0.55) 50%, transparent 62%)', backgroundSize: '260% 100%', backgroundRepeat: 'no-repeat' }}
        />
      </div>
      {/* The back cover, its hinge pressed in the same way. */}
      <div className="absolute inset-0 overflow-hidden bg-[#111] [backface-visibility:hidden]" style={{ transform: `rotateY(180deg) translateZ(${half})`, borderRadius: `${RADIUS} ${SPINE_R} ${SPINE_R} ${RADIUS}` }}>
        <Hinge side="right" />
      </div>
      {/* The pages' edges: top, bottom and the side opposite the spine. */}
      <div className="absolute inset-x-0 [backface-visibility:hidden]" style={{ height: css(SPINE_T), top: css(`${SPINE_T} / -2`), transform: 'rotateX(90deg)', backgroundImage: paper('bottom') }} />
      <div className="absolute inset-x-0 [backface-visibility:hidden]" style={{ height: css(SPINE_T), bottom: css(`${SPINE_T} / -2`), transform: 'rotateX(-90deg)', backgroundImage: paper('bottom') }} />
      <div className="absolute inset-y-0 [backface-visibility:hidden]" style={{ width: css(SPINE_T), right: css(`${SPINE_T} / -2`), transform: 'rotateY(90deg)', backgroundImage: paper('right') }} />
      {/* The spine, on the cover's left edge, a little rounded by the light. */}
      <div
        className="absolute inset-y-0 overflow-hidden bg-[#121212] text-white [backface-visibility:hidden]"
        style={{ width: css(SPINE_T), left: css(`${SPINE_T} / -2`), transform: 'rotateY(-90deg)', borderRadius: SPINE_R }}
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
        {/* Rounded across: in shade at both folds, the light along its middle. */}
        <span aria-hidden className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, rgb(0 0 0 / 0.5), rgb(0 0 0 / 0.12) 14%, rgb(255 255 255 / 0.12) 42%, rgb(255 255 255 / 0.06) 62%, rgb(0 0 0 / 0.12) 86%, rgb(0 0 0 / 0.55))' }} />
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
  const section = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const book = useRef<HTMLDivElement>(null)
  const shadow = useRef<HTMLSpanElement>(null)
  const spine = useRef<HTMLSpanElement>(null)
  const leaves = useRef<(HTMLDivElement | null)[]>([])
  const box = useRef<HTMLDivElement>(null)
  const boxShadow = useRef<HTMLSpanElement>(null)
  const controls = useRef<HTMLDivElement>(null)
  const tape = useRef<HTMLSpanElement>(null)
  const tail = useRef<HTMLDivElement>(null)
  const stackL = useRef<HTMLSpanElement>(null)
  const stackR = useRef<HTMLSpanElement>(null)
  // The cover is the first leaf; then one leaf per spread but the last.
  const turns = spreads.length
  // The page the reader is on: 0 = closed, k = k leaves turned.
  const [page, setPage] = useState(0)
  /** Where the pages are now (`at`: leaves turned, fractions mid-turn), how far the opening has gone, and the running turn. */
  const live = useRef({ at: 0, arrive: 0, leave: 0, user: false, page: 0, draw: () => {}, frame: 0 })

  // Draws the book for the current state, straight on the DOM.
  useEffect(() => {
    const strips = leaves.current.map((leaf) => Array.from(leaf?.querySelectorAll<HTMLElement>('[data-strip]') ?? []))
    live.current.draw = () => {
      const { at, arrive: a } = live.current
      const W = stage.current?.offsetWidth ?? 900
      const coverW = W / 2
      const coverH = W / 1.5
      const T = W * 0.036
      const opened = clamp01(at)

      // The opening: the spine, close and large, lying across; then the magazine turns upright to
      // its cover and sinks onto the surface.
      const turn = smooth(clamp01((a - TURN_FROM) / (TURN_TO - TURN_FROM)))
      const near = Math.min(CLOSE, (innerWidth * 0.86) / coverH)
      const scale = lerp(near, 1, easeOut(turn))
      const deg = 90 * (1 - turn)
      const sin = Math.sin((deg * Math.PI) / 180)
      const cos = Math.cos((deg * Math.PI) / 180)
      const bx = box.current
      if (bx) {
        bx.style.opacity = a >= 1 ? '0' : '1'
        bx.style.transform = `scale(${scale.toFixed(4)}) rotateZ(${(-deg).toFixed(2)}deg) rotateY(${deg.toFixed(2)}deg)`
        // Light from in front: a face darkens as it turns away.
        const shade = (k: string, v: number) => bx.querySelector<HTMLElement>(`[data-shade="${k}"]`)?.style.setProperty('opacity', v.toFixed(3))
        shade('spine', 0.6 * (1 - sin))
        shade('cover', 0.5 * (1 - cos))
        // A band of light sweeps across the cover while it turns, brightest halfway.
        const glare = bx.querySelector<HTMLElement>('[data-glare]')
        if (glare) {
          glare.style.opacity = (Math.sin(Math.PI * turn) * 0.9).toFixed(3)
          glare.style.backgroundPosition = `${(100 - 100 * turn).toFixed(1)}% 0`
        }
      }
      // Its shadow on the surface: the outline it shows, turned with it. Held up close it falls far
      // below it, soft and faint; set down it lies just under it, tighter and darker.
      const sh = boxShadow.current
      if (sh) {
        const lift = 1 - easeOut(turn)
        sh.style.opacity = a >= 1 ? '0' : '1'
        sh.style.width = `${((coverW * 0.96 * cos + T * sin) * scale).toFixed(1)}px`
        sh.style.height = `${(coverH * scale).toFixed(1)}px`
        sh.style.background = `rgb(0 0 0 / ${lerp(0.14, 0.25, 1 - lift).toFixed(3)})`
        sh.style.filter = `blur(${lerp(40, 70, lift).toFixed(1)}px)`
        sh.style.transform = `translate(-50%, -50%) translate(${(coverW * 0.02 + lift * W * 0.03).toFixed(1)}px, ${(coverH * 0.02 + lift * coverH * 0.22).toFixed(1)}px) rotate(${(-deg).toFixed(2)}deg)`
      }
      if (controls.current) controls.current.style.opacity = a >= 1 ? (1 - clamp01(live.current.leave / 0.3)).toFixed(3) : '0'
      // The tape under the arrows follows the pages; the number in the middle is at full strength.
      const tp = tape.current
      if (tp) {
        tp.style.transform = `translateX(${(-(at - TAPE_FROM + 0.5) * INCH_PX).toFixed(1)}px)`
        tp.querySelectorAll<HTMLElement>('[data-n]').forEach((n) => {
          n.style.opacity = (1 - 0.7 * Math.min(1, Math.abs(Number(n.dataset.n) - at))).toFixed(3)
        })
      }

      // Closed, the cover sits in the middle; open, the spine does. The real book shows once the box faces you.
      const b = book.current
      if (b) {
        b.style.transform = `translateX(${(-25 * (1 - opened)).toFixed(2)}%)`
        b.style.opacity = a >= 1 ? '1' : '0'
      }
      if (shadow.current) shadow.current.style.left = `${(50 * (1 - opened) + 1).toFixed(2)}%`
      if (spine.current) spine.current.style.opacity = String(opened)
      // The page block's thickness on each side, a pair of sheets a pixel each.
      const sheets = (n: number, dir: 1 | -1) =>
        Array.from({ length: n }, (_, i) => `${dir * (i + 1)}px ${(i + 1) * 0.6}px 0 ${i % 2 ? '#d9d5cd' : '#f6f4ef'}`).join(', ') || 'none'
      const left = Math.round(Math.min(at, turns) * 1.6)
      if (stackL.current) stackL.current.style.boxShadow = sheets(at >= 0.5 ? Math.max(2, Math.min(8, left)) : 0, -1)
      if (stackR.current) stackR.current.style.boxShadow = sheets(Math.max(2, Math.min(8, Math.round((turns - at) * 1.6) + 2)), 1)
      leaves.current.forEach((leaf, k) => {
        if (!leaf) return
        // Leaf k is k + e turned: a drag (or the turn) sets e straight.
        const e = clamp01(at - k)
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

  // The opening follows the scroll while the section is pinned (and back, scrolling up). Once the
  // reader has opened the magazine, or clicked during the opening, it stays a book.
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
    const read = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const p = clamp01(-r.top / Math.max(1, r.height - innerHeight))
        // Leaving for the footer: once the magazine starts to scroll away, the arrows fade out.
        const leave = clamp01((innerHeight - r.bottom) / (innerHeight * 0.3))
        if (leave !== l.leave) {
          l.leave = leave
          if (l.user) l.draw()
        }
        // Once the reader has turned a page, the scroll leaves the magazine as it is.
        if (l.user) return
        l.arrive = Math.min(1, p / INTRO_END)
        l.at = smooth(clamp01((p - OPEN_FROM) / (OPEN_TO - OPEN_FROM)))
        const shown = Math.round(l.at)
        if (shown !== l.page) {
          l.page = shown
          setPage(shown)
        }
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

  // Redraw on resize (the shadow and the close-up are sized in pixels).
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(() => live.current.draw())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The room under the magazine: enough that, with the footer filling the rest of the screen, none
  // of the magazine is left in view at the bottom of the page.
  useEffect(() => {
    const el = tail.current
    const footer = document.querySelector('footer')
    if (!el || !footer) return
    const fit = () => (el.style.height = `${Math.max(0, innerHeight - footer.offsetHeight) + 16}px`)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(footer)
    addEventListener('resize', fit)
    return () => {
      ro.disconnect()
      removeEventListener('resize', fit)
    }
  }, [])

  /** Eases the pages to `to` (whole leaves turned): a turn a page, faster through many. */
  const ease = (to: number, released = false) => {
    const l = live.current
    cancelAnimationFrame(l.frame)
    l.page = to
    setPage(to)
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      l.at = to
      l.draw()
      return
    }
    const from = l.at
    const dist = Math.abs(to - from)
    if (!dist) return
    const ms = TURN_MS * (dist <= 1 ? Math.max(0.35, dist) : Math.sqrt(dist))
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      l.at = from + (to - from) * (released ? easeOut(p) : smooth(p))
      l.draw()
      if (p < 1) l.frame = requestAnimationFrame(tick)
    }
    l.frame = requestAnimationFrame(tick)
  }

  /** The reader takes over: the opening ends at once and the scroll stops turning pages. */
  const finishOpening = () => {
    const l = live.current
    l.user = true
    if (l.arrive < 1) {
      l.arrive = 1
      l.draw()
    }
  }

  // Back from the cover or on from the last page does nothing (its arrow is off).
  const step = (d: number) => {
    finishOpening()
    const p = live.current.page
    const to = Math.min(turns, Math.max(0, p + d))
    if (to !== p) ease(to)
  }

  // The pointer over the magazine (drawn by Cursor): a finger while it is closed (a click opens it),
  // the open hand once it is open, closing on a page while it holds it.
  const handAt = (e: React.PointerEvent) => {
    const st = stage.current
    if (!st || e.pointerType !== 'mouse') return
    // The light on the glossy pages follows the mouse a little.
    const sr = st.getBoundingClientRect()
    st.style.setProperty('--gx', `${(20 + 40 * ((e.clientX - sr.left) / sr.width)).toFixed(1)}%`)
    const l = live.current
    st.dataset.cursor = l.arrive < 1 ? 'arrow' : l.at < 0.02 && !drag.current.moved ? 'finger' : 'grab'
  }

  /** Where the spine is across the stage now (px): the cover's left edge while closed, the middle once open. */
  const spineX = () => {
    const W = stage.current?.offsetWidth ?? 0
    return W / 2 - 0.25 * W * (1 - clamp01(live.current.at))
  }
  /** Where leaf k's free edge is across the stage (px) when it is e turned. */
  const edgeX = (k: number, e: number) => {
    const W = stage.current?.offsetWidth ?? 0
    const opened = k === 0 ? e : 1
    return W / 2 - 0.25 * W * (1 - opened) + Math.cos(Math.PI * e) * (W / 2)
  }

  // Dragging a page: it is caught where it was pressed and its edge follows the pointer, forward
  // or back, as far as you drag; let go and it falls the way it was going.
  const drag = useRef<{ x: number; y: number; k: number | null; e0: number; moved: boolean; pressed: boolean }>({ x: 0, y: 0, k: null, e0: 0, moved: false, pressed: false })
  const onDown = (e: React.PointerEvent) => {
    const l = live.current
    handAt(e)
    drag.current = { x: e.clientX, y: e.clientY, k: null, e0: 0, moved: false, pressed: true }
    if (l.arrive < 1) return
    const st = stage.current!
    const x = e.clientX - st.getBoundingClientRect().left
    const cur = l.page
    // The right page turns on; the left one back.
    const k = x >= spineX() ? (cur < turns ? cur : null) : cur > 0 ? cur - 1 : null
    if (k === null) return
    cancelAnimationFrame(l.frame)
    drag.current.k = k
    drag.current.e0 = x >= spineX() ? 0 : 1
    st.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    handAt(e)
    if (!d.pressed || d.k === null) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) < 6) return
    if (!d.moved && Math.abs(e.clientY - d.y) > Math.abs(dx)) {
      d.k = null // a scroll, not a turn
      return
    }
    d.moved = true
    finishOpening()
    // The edge goes where the pointer goes: find how far the leaf is turned for that.
    const target = edgeX(d.k, d.e0) + dx
    let best = 0
    let gap = Infinity
    for (let i = 0; i <= 200; i++) {
      const t = i / 200
      const g = Math.abs(edgeX(d.k, t) - target)
      if (g < gap) [gap, best] = [g, t]
    }
    const l = live.current
    l.at = d.k + best
    l.draw()
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    d.pressed = false
    handAt(e)
    if (!d.moved || d.k === null) return
    const e1 = live.current.at - d.k
    // Forward, a third of the way over is enough; back, the same.
    ease(d.e0 === 0 ? (e1 > 0.33 ? d.k + 1 : d.k) : e1 < 0.67 ? d.k : d.k + 1, true)
  }

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
    <section
      data-magazine
      aria-label={`${pad(number)} ${heading}`}
      aria-roledescription="carousel"
      className="relative"
      // On a grey surface, fading in from the page and grey down to the footer.
      style={{
        background: 'linear-gradient(to bottom, var(--bg), var(--surface-mag) 45vh)',
        ['--surface-mag' as string]: 'color-mix(in srgb, var(--fg) 9%, var(--bg))',
      }}
    >
      {/* The pinned stretch: the opening, the cover opening, then the magazine scrolls away. */}
      <div ref={section} className="relative h-[220vh] md:h-[380vh] motion-reduce:!h-auto">
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center gap-[clamp(20px,3vh,36px)] overflow-x-clip pt-[clamp(40px,7vh,72px)] motion-reduce:static motion-reduce:py-20">
        <div
          ref={stage}
          className="relative select-none"
          style={{ width: BOOK_W, aspectRatio: '3 / 2', perspective: '2600px', touchAction: 'pan-y' }}
          onPointerMove={onMove}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={(e) => {
            drag.current.pressed = false
            handAt(e)
          }}
          onPointerEnter={(e) => handAt(e)}
          onClick={(e) => {
            if (drag.current.moved) return
            // During the opening, a click skips to the cover.
            if (live.current.arrive < 1) return finishOpening()
            // Closed, a click anywhere opens it; open, the left page goes back and the right one on.
            const x = e.clientX - e.currentTarget.getBoundingClientRect().left
            step(page === 0 || x >= spineX() ? 1 : -1)
          }}
        >
          {/* The closed magazine's shadow on the surface, following its outline as it turns. */}
          <span ref={boxShadow} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2" />
          <ClosedBook boxRef={box} cover={cover} division={division} number={number} heading={heading} />
          <div ref={book} className="absolute inset-0 will-change-transform" style={{ perspective: '2600px', transform: 'translateX(-25%)', opacity: 0 }}>
            {/* The book's shadow on the surface: under the cover while closed, under both pages once open. */}
            <span ref={shadow} aria-hidden className="absolute inset-y-[2%] left-[51%] right-[1%] bg-black/25 blur-[40px]" style={{ bottom: '-2%' }} />

            {/* The pages' edges, stacked under each side: as many as are left to turn on the right,
                as many as are turned on the left (drawn as offset outlines, so they only show at the edges). */}
            <span ref={stackL} aria-hidden className="absolute inset-y-0 left-0 w-1/2" style={{ borderTopLeftRadius: RADIUS, borderBottomLeftRadius: RADIUS }} />
            <span ref={stackR} aria-hidden className="absolute inset-y-0 right-0 w-1/2" style={{ borderTopRightRadius: RADIUS, borderBottomRightRadius: RADIUS }} />

            {/* Last right page: the last model, under all the leaves. */}
            <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden" style={{ borderTopRightRadius: RADIUS, borderBottomRightRadius: RADIUS }}>
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
                      {k > 0 ? <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: fold('right') }} /> : <Hinge side="left" />}
                    </>
                  }
                  back={
                    <>
                      {f.back}
                      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: fold('left') }} />
                      {/* Inside the cover, the same crease seen from the other side. */}
                      {k === 0 && <Hinge side="right" strength={0.55} />}
                    </>
                  }
                />
              </div>
            ))}

            {/* The spine, once open. */}
            <span ref={spine} aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-50 w-px -translate-x-1/2 bg-black/20" style={{ opacity: 0 }} />
          </div>


        </div>

        {/* Back | the spread's number on an inch of the INCH” ruler | on. Each arrow is off at its end. */}
        <div ref={controls} className="mt-[clamp(16px,4vh,48px)] flex max-w-full items-end gap-[clamp(10px,4vw,64px)] transition-opacity duration-300" style={{ opacity: 0 }}>
          <button type="button" aria-label="Previous page" onClick={() => step(-1)} disabled={page === 0} className="p-2 transition-[opacity,transform] duration-200 enabled:hover:-translate-x-1 disabled:cursor-default disabled:opacity-15">
            <Arrow dir="left" />
          </button>
          {/* The tape slides with the pages (and with a page held mid-turn), as on the hero. */}
          <span aria-hidden className="relative block overflow-hidden pb-2" style={{ width: TAPE_WIN, maskImage: 'linear-gradient(to right, transparent, #000 30%, #000 70%, transparent)' }}>
            {/* Starts at the window's middle (left: 50%); the transform brings the current inch to it. */}
            <span ref={tape} className="relative left-1/2 flex w-max will-change-transform" style={{ transform: `translateX(${-(0 - TAPE_FROM + 0.5) * INCH_PX}px)` }}>
              {Array.from({ length: turns + 1 - 2 * TAPE_FROM }, (_, j) => {
                const i = j + TAPE_FROM
                return (
                  <span key={i} className="block shrink-0" style={{ width: INCH_PX }}>
                    <span data-n={i} className="block h-[1.2em] text-center text-[clamp(15px,1.3vw,18px)] font-extrabold leading-none tabular-nums" style={{ opacity: i === 0 ? 1 : 0.3 }}>
                      {i >= 0 && i <= turns ? pad(i) : ''}
                    </span>
                    <span className="mt-1 block h-[18px]" style={{ ...rulerTicks(18, 9, INCH_PX), width: `calc(100% + ${SEG_OVERLAP})` }} />
                  </span>
                )
              })}
            </span>
          </span>
          <button type="button" aria-label="Next page" onClick={() => step(1)} disabled={page === turns} className="p-2 transition-[opacity,transform] duration-200 enabled:hover:translate-x-1 disabled:cursor-default disabled:opacity-15">
            <Arrow dir="right" />
          </button>
          <span aria-live="polite" className="sr-only">
            {page === 0 ? 'Cover' : `Page ${page} of ${turns}`}
          </span>
        </div>
      </div>
      </div>
      {/* Room for the magazine to scroll right out of sight before the footer comes up. */}
      <div ref={tail} aria-hidden style={{ height: '40vh' }} />
    </section>
  )
}
