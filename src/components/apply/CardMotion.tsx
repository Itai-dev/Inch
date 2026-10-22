'use client'

/**
 * The application card's two moments, on heavy letterpress paper.
 * - CardOpening: the page opens on the card, simply there in the middle, its back showing (the
 *   application's headline), growing a touch. In one move it turns over about its upright axis as
 *   it goes to its place: beside the form it becomes the comp card (desktop); on phones it shrinks
 *   into the folded strip, so it is the strip. The page writes itself in before it arrives.
 * - CardPost: once the application is sent, in one continuous move the card arcs up over an
 *   envelope rising under it and down into it, the flap closes, and the envelope goes on down into
 *   a drawer (seen from above, among others' envelopes) that slides shut on it.
 * Both draw copies over the page (fixed), so the page under them lays itself out undisturbed.
 */
import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { Logo } from '@/components/brand/Logo'
import { LEFT_PATH, QuoteMark, RIGHT_PATH } from '@/components/brand/Marks'
import { bendLeaf, Leaf } from './Leaf'
import { SITES, siteForDivision } from '@/lib/sites'
import type { Division } from '@/sanity/lib/types'

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
const EASE_OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)'
/** Where the card goes or comes from: the card itself beside the form (`card`), or the strip it folds into on phones.
 * Beside the form the card is zoomed to fit the screen's height (`zoom`): the copies are drawn at its unzoomed width and scaled to match. */
export type Place = { el: HTMLElement; card: boolean; zoom?: number } | null
/** The card's width over the page: the real card's (before its zoom) or the strip's, else a phone's comfortable width. */
const cardWidth = (r: DOMRect | null, zoom = 1) => (r ? r.width / zoom : Math.min(innerWidth * 0.86, 380))

/** The envelope round a card of w × h: a little wider and taller; its flap reaches just past the middle. */
const envSize = (w: number, h: number) => {
  const pad = Math.round(w * 0.045)
  const ew = w + pad * 2
  const eh = Math.round(h + pad * 2)
  return { pad, ew, eh, fh: Math.round(eh * 0.56) }
}
/** The pocket: the envelope's back with the V of its open top cut out, meeting where the flap's tip lands. */
const POCKET = 'polygon(0 0, 50% 54%, 100% 0, 100% 100%, 0 100%)'
/** The flap: a short straight side at each end, then the two slopes to its tip (as a real one is cut);
 * its inside, as seen when it stands open (tip up). */
const FLAP = 'polygon(0 0, 100% 0, 100% 16%, 50% 100%, 0 16%)'
const FLAP_INSIDE = 'polygon(0 100%, 100% 100%, 100% 84%, 50% 0, 0 84%)'
/** The bottom flap, folded up from the bottom edge to a point just under where the top flap's tip lies. */
const BOTTOM_FLAP = 'polygon(0 100%, 50% 47%, 100% 100%)'
/** Thin paper: in the middle a little of what is inside shows through (most where the flaps meet). */
const SHOW_THROUGH = {
  maskImage: 'radial-gradient(ellipse 46% 40% at 50% 56%, rgb(0 0 0 / 0.8), rgb(0 0 0 / 0.93) 55%, #000 100%)',
  WebkitMaskImage: 'radial-gradient(ellipse 46% 40% at 50% 56%, rgb(0 0 0 / 0.8), rgb(0 0 0 / 0.93) 55%, #000 100%)',
} as const
const FLAP_SHOW_THROUGH = {
  maskImage: 'radial-gradient(ellipse 40% 55% at 50% 100%, rgb(0 0 0 / 0.82), rgb(0 0 0 / 0.94) 55%, #000 100%)',
  WebkitMaskImage: 'radial-gradient(ellipse 40% 55% at 50% 100%, rgb(0 0 0 / 0.82), rgb(0 0 0 / 0.94) 55%, #000 100%)',
} as const

/** The house's name printed in black across the top of the flap, as a maison's envelope has it (sized to the flap). */
function FlapPrint({ division }: { division: Division }) {
  return (
    <span className="absolute inset-x-0 top-[16%] flex justify-center text-[#0a0a0a]" style={{ fontSize: 'min(6.5cqw, 15cqh)' }}>
      <Logo division={division} />
    </span>
  )
}

/**
 * The seal: a round black foil sticker, glossy, catching the light, the house's mark
 * (INCH”'s ”, DOT.'s ■) raised in the middle and its name and the application's run round the
 * edge, raised the same way (light on the upper edges, shade under).
 */
function FoilSticker({ division, id }: { division: Division; id: string }) {
  const brand = SITES[siteForDivision(division)].brand
  const words = `${brand} Model Management · Model Application · `
  const mark =
    division === 'men' ? (
      <rect x="40.65" y="40.65" width="18.7" height="18.7" />
    ) : (
      <g transform="translate(38.2 36.73) scale(0.3685)">
        <path d={LEFT_PATH} />
        <path d={RIGHT_PATH} />
      </g>
    )
  const ring = (
    <text fontSize="6.6" fontWeight="700" letterSpacing="0.9" style={{ textTransform: 'uppercase', fontStretch: '85%' }}>
      <textPath href={`#${id}-ring`} textLength="232" lengthAdjust="spacing">
        {words}
      </textPath>
    </text>
  )
  // Raised: shade under and to the right, light over and to the left, the foil's own colour on top.
  const raised = (node: React.ReactNode) => (
    <>
      <g fill="rgb(0 0 0 / 0.85)" transform="translate(0.45 0.65)">
        {node}
      </g>
      <g fill="rgb(255 255 255 / 0.32)" transform="translate(-0.4 -0.5)">
        {node}
      </g>
      <g fill="#141414">{node}</g>
    </>
  )
  return (
    <div data-foil className="absolute inset-[5%] overflow-hidden rounded-full" style={{ ...FOIL, boxShadow: '0 0.8px 0 #000, 0 1.4px 1.6px rgb(0 0 0 / 0.28)' }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
        <defs>
          <path id={`${id}-ring`} d="M50 50 m-37 0 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" />
        </defs>
        {raised(ring)}
        {raised(mark)}
      </svg>
      {/* Its edge: a fine bright rim. */}
      <span className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 0 0.6px rgb(255 255 255 / 0.28), inset 0 -1px 2px rgb(0 0 0 / 0.5)' }} />
    </div>
  )
}
/** Glossy black foil: deep black, the light lying across it in soft bands. */
const FOIL = {
  backgroundImage: [
    'repeating-linear-gradient(100deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px 3px)',
    'linear-gradient(125deg, #060606 0%, #232323 22%, #0a0a0a 40%, #4a4a4a 52%, #101010 62%, #0b0b0b 80%, #262626 100%)',
  ].join(','),
  backgroundSize: '100% 100%, 220% 220%',
  backgroundPosition: '0 0, 20% 20%',
} as const

/**
 * The mark pressed into the flap near its tip, the size of the sticker's mark and just where it
 * lands (so the sticker covers it). In the flap's own units: the sticker is min(30% of the
 * envelope's width, 42% of its height) across, centred 53% down it; the flap is 56% of its height.
 */
function FlapIndent({ division }: { division: Division }) {
  return (
    <span
      className="absolute left-1/2 top-[94.6%] block -translate-x-1/2 -translate-y-1/2"
      style={{ ...blind, height: 'min(8.75cqw, 21.9cqh)', aspectRatio: division === 'men' ? '1' : '64 / 72' }}
    >
      {division === 'men' ? <span className="block size-full scale-[0.705] bg-current" /> : <QuoteMark className="!h-full !w-full" />}
    </span>
  )
}

/** Off screen until the animation places it. */
const OFF = { transform: 'translateY(300vh)' } as const

/** Ink pressed into the paper: dark, with the light catching the lower lip of the impression. */
const press = { textShadow: '0 1px 0 rgb(255 255 255 / 0.75)' } as const
/** Blind deboss: no ink, just the shape pushed into the paper. */
const blind = { filter: 'drop-shadow(0 1px 0 rgb(255 255 255 / 0.95)) drop-shadow(0 -1px 0 rgb(0 0 0 / 0.18))', color: '#d6d3cb' } as const

/**
 * A seal pressed blind into the card (no ink): the house's mark in the middle, its name and the
 * application's run round it, a dotted ring inside and a fine toothed edge outside, as an
 * embossing press leaves them. Sunk into the paper: shade along the upper edges, light along the
 * lower ones.
 */
function BlindSeal({ division, id }: { division: Division; id: string }) {
  const brand = SITES[siteForDivision(division)].brand
  const words = `${brand} Model Management · Official Model Application · `
  const ring = (r: number, n: number, f: (a: number) => React.ReactNode) => Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2))
  const at = (a: number, r: number) => [50 + r * Math.cos(a), 50 + r * Math.sin(a)].map((v) => v.toFixed(2))
  const teeth = ring(47, 150, (a) => `M${at(a, 45.4).join(' ')} L${at(a, 48.6).join(' ')}`).join(' ')
  const shapes = (
    <>
      <path d={teeth} stroke="currentColor" strokeWidth="0.5" fill="none" />
      <circle cx="50" cy="50" r="44.4" stroke="currentColor" strokeWidth="0.45" fill="none" />
      {ring(29.5, 64, (a) => {
        const [cx, cy] = at(a, 29.5)
        return <circle key={a} cx={cx} cy={cy} r="0.42" />
      })}
      <text fontSize="5.2" fontWeight="700" letterSpacing="0.75" style={{ textTransform: 'uppercase', fontStretch: '85%' }}>
        <textPath href={`#${id}-ring`} textLength="231" lengthAdjust="spacing">
          {words}
        </textPath>
      </text>
      {division === 'men' ? (
        <rect x="42" y="42" width="16" height="16" />
      ) : (
        <g transform="translate(40.4 39.2) scale(0.3)">
          <path d={LEFT_PATH} />
          <path d={RIGHT_PATH} />
        </g>
      )}
    </>
  )
  return (
    <svg viewBox="0 0 100 100" className="block size-full overflow-visible" aria-hidden>
      <defs>
        <path id={`${id}-ring`} d="M50 50 m-37.4 0 a37.4 37.4 0 1 1 74.8 0 a37.4 37.4 0 1 1 -74.8 0" />
      </defs>
      <g color="rgb(255 255 255 / 0.95)" fill="currentColor" transform="translate(0.3 0.45)">
        {shapes}
      </g>
      <g color="rgb(60 50 30 / 0.3)" fill="currentColor" transform="translate(-0.22 -0.32)">
        {shapes}
      </g>
      <g color="#f2f1ec" fill="currentColor">
        {shapes}
      </g>
    </svg>
  )
}

/** The card's back: the house's name printed in black, what it is, and the seal pressed into a corner. */
function Headline({ division }: { division: Division }) {
  const s = SITES[siteForDivision(division)]
  const id = `blind-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <div data-back className="paper absolute inset-0 flex flex-col items-center p-[clamp(22px,2.6vw,40px)] text-center text-[#141414] [backface-visibility:hidden] [container-type:size]" style={{ transform: 'rotateY(180deg) translateZ(1px)' }}>
      {/* The plate's impression, a hairline inside the edge. */}
      <span aria-hidden className="pointer-events-none absolute inset-[10px] shadow-[inset_0_1px_1px_rgb(0_0_0/0.07),inset_0_-1px_0_rgb(255_255_255/0.6)]" />
      {/* The name at the top, what it is in the middle, the house at the foot; the seal pressed in at the top left. */}
      <span className="absolute left-[4%] top-[5%] block aspect-square" style={{ width: 'min(34cqw, 40cqh)', transform: 'rotate(-9deg)' }}>
        <BlindSeal division={division} id={id} />
      </span>
      <span className="mt-[3%] text-[#0a0a0a]" style={{ fontSize: 'min(9cqw, 8cqh)' }}>
        <Logo division={division} />
      </span>
      {/* Raised a little: the fine "Official" weighs less than the line under it, so the block sits optically centred. */}
      <p className="my-auto flex flex-col items-center" style={{ ...press, transform: 'translateY(-3.5cqh)' }}>
        {/* "Official" signed across it in a fine hand, then what it is. */}
        <span className="relative z-[1] -mb-[0.1em] -rotate-[4deg] text-[#0a0a0a]" style={{ fontFamily: '"Mrs Saint Delafield", cursive', fontSize: 'min(12.65cqw, 16.5cqh)', lineHeight: 1 }}>
          Official
        </span>
        <span className="wordmark whitespace-nowrap uppercase leading-[0.92]" style={{ fontSize: 'min(7.9cqw, 11.55cqh)' }}>
          Model Application
        </span>
      </p>
      <span className="mb-[3%] text-[9px] uppercase tracking-[0.42em] text-[#55534f]" style={press}>
        {s.brand} Model Management
      </span>
    </div>
  )
}

/** A classic envelope's three layers, placed by the caller: its inside, the pocket in front of the card, and the flap. */
function Envelope({
  division,
  back,
  pocket,
  flap,
  seal,
}: {
  division: Division
  back: React.Ref<HTMLDivElement>
  pocket: React.Ref<HTMLDivElement>
  flap: React.Ref<HTMLDivElement>
  seal: React.Ref<HTMLDivElement>
}) {
  const sealId = `seal-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  // The flap's face: the paper, the house's name printed on it, the mark pressed in near its tip.
  const flapFront = (
    <div className="absolute inset-0 [container-type:size]" style={FLAP_SHOW_THROUGH}>
      <div className="envelope-paper absolute inset-0" style={{ clipPath: FLAP }}>
        {/* Shaded towards its point, so it reads as a sheet folded over. */}
        <div className="absolute inset-x-0 bottom-0 h-[45%]" style={{ background: 'linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.05))' }} />
      </div>
      <FlapPrint division={division} />
      <FlapIndent division={division} />
    </div>
  )
  return (
    <>
      {/* Inside, behind the card: the same stock, in shade. No shadow under it (nothing is behind it to
          fall on), only its thickness: the edge of its paper along the foot. */}
      <div ref={back} style={OFF} className="envelope-paper absolute left-0 top-0 z-[1] origin-top-left shadow-[inset_0_0_0_999px_rgb(0_0_0/0.09),0_1.5px_0_#dcd9d2,0_2.5px_0_#cdcac2]" />
      {/* In front of the card: the back of the envelope, its two side flaps and, over them, the bottom
          flap folded up to a point under the top flap. The paper is thin: in the middle the card
          inside shows through a little. */}
      <div ref={pocket} style={{ ...OFF, ...SHOW_THROUGH }} className="absolute left-0 top-0 z-[3] origin-top-left">
        <div className="absolute inset-0 [filter:drop-shadow(0_-1px_1px_rgb(0_0_0/0.12))]">
          <div className="envelope-paper absolute inset-0" style={{ clipPath: POCKET }}>
            {/* The side flaps in a little shade towards the folds, so they read as two sheets meeting. */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgb(0 0 0 / 0.045), transparent 30%, transparent 70%, rgb(0 0 0 / 0.045))' }} />
          </div>
        </div>
        <div className="absolute inset-0 [filter:drop-shadow(0_-1px_1.5px_rgb(0_0_0/0.13))]">
          <div className="envelope-paper absolute inset-0" style={{ clipPath: BOTTOM_FLAP }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, transparent 40%, rgb(0 0 0 / 0.03))' }} />
          </div>
        </div>
      </div>
      {/* The flap: closed over the top, the mark pressed into its tip; open, it stands up behind,
          showing its inside. It is paper: a leaf that bends as it turns (as the magazine's pages do). */}
      <div ref={flap} style={OFF} className="absolute left-0 top-0 z-[4] origin-top [transform-style:preserve-3d]">
        <Leaf
          strips={14}
          shade={false}
          front={flapFront}
          back={<div className="envelope-paper absolute inset-0" style={{ clipPath: FLAP_INSIDE, boxShadow: 'inset 0 0 0 999px rgb(0 0 0 / 0.06)' }} />}
        />
        {/* Lying closed it is one flat sheet (no strips), so what is printed on it is drawn once, crisp. */}
        <div data-flap-flat className="absolute inset-0" style={{ visibility: 'hidden' }}>
          {flapFront}
        </div>
      </div>
      {/* The seal: a sticker laid on where the flap's tip lies once it is closed. It goes on like
          paper: its top touches first and the rest is smoothed down after it (a bending leaf). */}
      <div ref={seal} style={OFF} className="pointer-events-none absolute left-0 top-0 z-[5] origin-top-left [container-type:size]">
        <span data-sticker className="absolute left-1/2 top-[53%] block aspect-square" style={{ width: 'min(33.3cqw, 46.7cqh)', transform: 'translate(-50%, -50%)', perspective: '700px', visibility: 'hidden' }}>
          <Leaf strips={10} shade={false} front={<FoilSticker division={division} id={sealId} />} back={<div className="absolute inset-[5%] rounded-full bg-[#1a1a1a]" />} />
        </span>
      </div>
    </>
  )
}

/** A sealed envelope as ours is once its flap is down (the same layers and paper), standing in the drawer. */
function ClosedEnvelope({ division }: { division: Division }) {
  return (
    <div data-closed className="absolute left-0 top-0 origin-top-left">
      <div className="envelope-paper absolute inset-0 shadow-[inset_0_0_0_999px_rgb(0_0_0/0.09)]" />
      <div data-closed-flap className="absolute inset-x-0 top-0 [container-type:size]">
        <div className="absolute inset-0 [filter:drop-shadow(0_2px_2px_rgb(0_0_0/0.14))]">
          <div className="envelope-paper absolute inset-0" style={{ clipPath: FLAP }}>
            <div className="absolute inset-x-0 bottom-0 h-[45%]" style={{ background: 'linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.05))' }} />
          </div>
        </div>
        <FlapPrint division={division} />
        <FlapIndent division={division} />
      </div>
    </div>
  )
}

/** Sizes and places the envelope's layers; returns their animations' targets. */
function fit(els: (HTMLElement | null)[], ew: number, eh: number, fh: number) {
  const [back, pocket, flap] = els
  for (const el of [back, pocket]) if (el) Object.assign(el.style, { width: `${ew}px`, height: `${eh}px` })
  if (flap) Object.assign(flap.style, { width: `${ew}px`, height: `${fh}px` })
}
const at = (x: number, y: number, scale = 1) => `translate(${x}px, ${y}px) scale(${scale})`
/** The flap turns about its top edge's middle; `x` is where its top-left corner lands, at scale `sc`. */
const flapAt = (x: number, y: number, deg: number, ew: number, sc: number) =>
  `translate(${x - (ew * (1 - sc)) / 2}px, ${y}px) scale(${sc}) perspective(1400px) rotateX(${deg}deg)`
/**
 * The slot opens into a drawer seen from above: one ruler lying in it, running away from the eye
 * to a vanishing point above. Depth `u` runs 0 (the slot line, at the front) to DRAWER_UNITS (the
 * back); a line `u` deep sits vp * (1 - fz(u)) px above the slot and fz(u) of its width.
 */
const DRAWER_UNITS = 16
/** How far up the vanishing point is, against the drawer's width at the front (and at most against the screen's height). */
const DRAWER_RISE = 0.7
const DRAWER_RISE_MAX = 0.28
const fz = (u: number) => 1 / (1 + u * 0.16)
/** The inch ruler's ticks along both its edges between the whole steps, as on every ruler on the
 * site: nine short ones, the middle one taller. [depth within a step, length]. */
const DRAWER_TICKS: [number, number][] = Array.from({ length: 9 }, (_, i) => [(i + 1) / 10, i === 4 ? 0.7 : 0.45])
/** A tick at full length, as a share of the drawer's width there. */
const DRAWER_TICK = 0.14
/** Where ours goes in: between the two nearest lines. How much of it shows above them (against the rise), and its share of the width there. */
const OURS_U = 0.5
const OURS_SHOW = 0.085
const OURS_SHARE = 0.78
/** Envelopes already in it (others have applied): [depth, share of the width, height against ours].
 * Each stands a little out of line: shifted and turned by a small random amount (up to these). */
const DRAWER_ENVELOPES: [number, number, number][] = [
  [1.5, 0.76, 1],
  [2.5, 0.8, 1.15],
  [4.5, 0.74, 0.9],
  [5.5, 0.78, 1.1],
  [7.5, 0.76, 1],
  [8.5, 0.8, 0.95],
  [10.5, 0.75, 1.1],
  [11.5, 0.79, 1],
  [12.5, 0.77, 0.9],
  [14.5, 0.8, 1.05],
  [15.5, 0.75, 1],
]
const JITTER_SHIFT = 0.025
const JITTER_TURN = 1.2
/** Ours lands a touch askew too (deg). */
const OURS_TILT = -0.8
const easeOut = (t: number) => 1 - (1 - t) ** 3
/** Slow away, then on: the drawer going in. */
const easeIn = (t: number) => t * t * (1.4 - 0.4 * t)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const span = (ms: number, from: number, to: number) => Math.min(1, Math.max(0, (ms - from) / (to - from)))

/** Clear of the top bar above, and room for the slot below. */
const ENV_TOP = 96
const ENV_FOOT = 130
/** The envelope's scale: small, whole on screen with its flap open above it (and the slot under it). */
const envScale = (ew: number, eh: number, fh: number) => Math.min(0.8, (innerWidth * 0.56) / ew, ((innerHeight - ENV_TOP - ENV_FOOT) * 0.85) / (eh + fh))

export function CardOpening({
  front,
  compact,
  division,
  target,
  onWrite,
  onDone,
  skipRef,
}: {
  /** The comp card, for beside the form. */
  front: React.ReactNode
  /** The folded strip (and the card under it), for phones. */
  compact: React.ReactNode
  division: Division
  /** Where the card ends up: the aside (desktop) or the folded strip (phones). */
  target: () => Place
  /** On its way (before it arrives): the page can start writing itself in. */
  onWrite: () => void
  onDone: () => void
  /** Set to a function that jumps the card to its place at once (for the impatient: a tap anywhere). */
  skipRef?: React.MutableRefObject<(() => void) | null>
}) {
  const stage = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const flip = useRef<HTMLDivElement>(null)
  const desk = useRef<HTMLDivElement>(null)
  const phone = useRef<HTMLDivElement>(null)
  const done = useRef(onDone)
  const write = useRef(onWrite)
  useLayoutEffect(() => {
    done.current = onDone
    write.current = onWrite
  })

  // After the page's own refs are set (the card's place is measured from them).
  useEffect(() => {
    const el = box.current
    const fl = flip.current
    if (!el || !fl) return
    const t = target()
    const r = t?.el.getBoundingClientRect() ?? null
    const toCard = !t || t.card
    const zoom = t?.zoom ?? 1
    // Beside the form the card turns to the comp card; on phones to the strip.
    if (desk.current) desk.current.style.display = toCard ? '' : 'none'
    if (phone.current) phone.current.style.display = toCard ? 'none' : ''
    const w = cardWidth(r, zoom)
    el.style.width = `${w}px`
    const h = el.offsetHeight
    // Whole on screen in the middle, with room round it for the turn: sized to what is actually
    // visible (on phones the browser's own bars take part of the window), never cut off.
    const vh = window.visualViewport?.height ?? innerHeight
    const top = window.visualViewport?.offsetTop ?? 0
    const fit = Math.min(1, (vh * 0.66) / h, (innerWidth - 56) / w)
    const place = (scale: number) => at((innerWidth - w * scale) / 2, top + (vh - h * scale) / 2 + 12, scale)
    const tx = r ? r.left : (innerWidth - w) / 2
    const ty = r ? r.top : (innerHeight - h) / 2
    // Phones: cut to the strip's folded height as it lands, so it is the strip.
    // Until then nothing is cut: while it turns, its near edge swings out past its own box.
    const free = `inset(-${h}px -${w}px -${h}px -${w}px)`
    const clipTo = !toCard && r ? `inset(0 0 ${Math.max(0, h - r.height + 1)}px 0)` : free

    // It comes up in the middle of the screen, its back up (the headline): growing from smaller and
    // tipping up from a slight lean back until it faces you; then it grows a touch more while it is
    // read; then in one move it turns over about its upright axis as it goes to its place (beside the
    // form, or into its strip on phones). The page writes itself in on the way.
    const glide = 'cubic-bezier(0.55, 0, 0.25, 1)'
    const ENTER = 1000
    const HOLD = ENTER + 1250
    const T = HOLD + 1100
    const WRITE = HOLD + 350
    const o = (ms: number) => ms / T
    const opts = { duration: T, fill: 'forwards' as const }
    const arrive = 'cubic-bezier(0.22, 0.6, 0.3, 1)'
    const card = el.animate(
      [
        { transform: place(fit * 0.8), clipPath: free, offset: 0, easing: arrive },
        { transform: place(fit), clipPath: free, offset: o(ENTER), easing: 'cubic-bezier(0.3, 0, 0.4, 1)' },
        { transform: place(fit * 1.06), clipPath: free, offset: o(HOLD), easing: glide },
        { transform: at(tx, ty, zoom), clipPath: clipTo, offset: 1 },
      ],
      opts,
    )
    const turn = fl.animate(
      [
        { transform: 'perspective(1800px) rotateX(-14deg) rotateY(180deg)', offset: 0, easing: arrive },
        { transform: 'perspective(1800px) rotateX(0deg) rotateY(180deg)', offset: o(ENTER) },
        { transform: 'perspective(1800px) rotateX(0deg) rotateY(180deg)', offset: o(HOLD), easing: glide },
        { transform: 'perspective(1800px) rotateX(0deg) rotateY(0deg)', offset: 1 },
      ],
      opts,
    )
    // The light slides across the paper as it turns.
    const light = el.animate(
      [
        { '--sheen': '20%', offset: 0 },
        { '--sheen': '20%', offset: o(HOLD), easing: glide },
        { '--sheen': '80%', offset: 1 },
      ] as Keyframe[],
      opts,
    )
    const writeAt = window.setTimeout(() => write.current(), WRITE)
    // No fade: the stage is simply there.
    if (stage.current) stage.current.style.opacity = '1'
    // Only the face turned toward you is drawn (each frame, from the card's actual turn), so neither
    // face ever shows through the other.
    const faceEl = fl.querySelector<HTMLElement>('[data-face]')
    const backEl = fl.querySelector<HTMLElement>('[data-back]')
    let raf = 0
    const faces = () => {
      const front = new DOMMatrix(getComputedStyle(fl).transform).m11 >= 0
      if (faceEl) faceEl.style.visibility = front ? 'visible' : 'hidden'
      if (backEl) backEl.style.visibility = front ? 'hidden' : 'visible'
      raf = requestAnimationFrame(faces)
    }
    faces()
    card.onfinish = () => {
      cancelAnimationFrame(raf)
      if (faceEl) faceEl.style.visibility = 'visible'
      if (backEl) backEl.style.visibility = 'hidden'
      done.current()
    }
    // Skipping: everything jumps to its end (which also finishes the card, and so calls onDone).
    if (skipRef) skipRef.current = () => [turn, light, card].forEach((a) => a?.finish())
    return () => {
      if (skipRef) skipRef.current = null
      clearTimeout(writeAt)
      cancelAnimationFrame(raf)
      ;[card, turn, light].forEach((a) => a?.cancel())
    }
    // Plays once, from where the page is when it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={stage} aria-hidden className="pointer-events-none fixed inset-0 z-30" style={{ opacity: 0 }}>
      <div ref={box} className="absolute left-0 top-0 origin-top-left">
        <div ref={flip} className="relative [transform-style:preserve-3d]">
          {/* Card has a thickness: its faces a pixel either side of the middle, its edges between them. */}
          <div data-face className="relative [backface-visibility:hidden]" style={{ transform: 'translateZ(1px)' }}>
            <div ref={desk}>{front}</div>
            <div ref={phone}>{compact}</div>
          </div>
          <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] origin-left bg-[#dedbd3]" style={{ transform: 'translateZ(1px) rotateY(90deg)' }} />
          <span aria-hidden className="absolute inset-y-0 right-0 w-[2px] origin-right bg-[#d6d3cb]" style={{ transform: 'translateZ(1px) rotateY(-90deg)' }} />
          <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] origin-top bg-[#e2dfd8]" style={{ transform: 'translateZ(1px) rotateX(-90deg)' }} />
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] origin-bottom bg-[#d2cfc7]" style={{ transform: 'translateZ(1px) rotateX(90deg)' }} />
          <Headline division={division} />
        </div>
      </div>
    </div>
  )
}

export function CardPost({
  front,
  division,
  from,
  onStart,
  onShut,
  onDone,
}: {
  front: React.ReactNode
  division: Division
  from: () => Place
  /** Ready and moving: the real card can go (the copy has taken its place). */
  onStart: () => void
  /** As the drawer goes in: where its slot is (the thanks' check comes up out of it). */
  onShut: (slot: { x: number; y: number }) => void
  /** All gone. */
  onDone: () => void
}) {
  const clip = useRef<HTMLDivElement>(null)
  const group = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const back = useRef<HTMLDivElement>(null)
  const pocket = useRef<HTMLDivElement>(null)
  const flap = useRef<HTMLDivElement>(null)
  const seal = useRef<HTMLDivElement>(null)
  const drawer = useRef<SVGSVGElement>(null)
  const standing = useRef<HTMLDivElement>(null)
  const done = useRef(onDone)
  const shut = useRef(onShut)
  const start = useRef(onStart)
  useLayoutEffect(() => {
    done.current = onDone
    shut.current = onShut
    start.current = onStart
  })

  // Before the first paint, so the card never shows anywhere but where it is.
  useLayoutEffect(() => {
    const el = box.current
    const c = clip.current
    const dr = drawer.current
    const st = standing.current
    const g = group.current
    if (!el || !c || !dr || !st || !g) return
    // Set up once the copy's photos are decoded (so it never shows an empty frame), then take over
    // from the real card (onStart).
    const run = () => {
      const f = from()
      const r = f?.el.getBoundingClientRect() ?? null
      const desk = !!f?.card
      const zoom = f?.zoom ?? 1
      // The same comp card on every screen: beside the form on a computer, unfolding out of its strip on a phone.
      const w = desk ? cardWidth(r, zoom) : Math.min(innerWidth - 40, 420)
      el.style.width = `${w}px`
      const h = el.offsetHeight
      const { pad, ew, eh, fh } = envSize(w, h)
      fit([back.current, pocket.current, flap.current], ew, eh, fh)
      if (seal.current) Object.assign(seal.current.style, { width: `${ew}px`, height: `${eh}px` })

      const vh = window.visualViewport?.height ?? innerHeight
      // The envelope, small, low in the middle; the card goes up over it and down into it; the drawer under it.
      const sc = envScale(ew, eh, fh)
      const ex = (innerWidth - ew * sc) / 2
      // Centred on the screen as the card goes in (its open flap kept clear of the top bar); it is
      // lifted above the middle for the sticker, and goes down into the drawer below.
      const ey = Math.max(ENV_TOP + fh * sc, (vh - eh * sc) / 2)
      const cx = ex + pad * sc
      const inY = ey + pad * sc
      // Wholly above the envelope's opening (in front of the open flap) at the top of its arc.
      const rise = Math.max(0, Math.min(h * sc + pad * sc + 6, inY - 60))
      // The drawer under it: its front edge (the slot line) low enough that its back clears the
      // envelope; wide enough that ours fills its share of it where it goes in.
      const slotW = (ew * sc) / (OURS_SHARE * fz(OURS_U))
      const vp = Math.min(slotW * DRAWER_RISE, vh * DRAWER_RISE_MAX)
      const tops = vp * OURS_SHOW
      const slotY = Math.round(Math.min(vh - 28, ey + eh * sc + vp * (1 - fz(DRAWER_UNITS)) + 14))
      const baseY = slotY - vp * (1 - fz(OURS_U))
      // Where it comes from: the card beside the form, or (phones) the strip, the card folded under it.
      const [sx, sy, ss] = r ? [r.left, r.top, desk ? zoom : r.width / w] : [(innerWidth - w) / 2, vh + 20, 1]
      const folded = !desk && r ? Math.max(0, h - r.height / (r.width / w)) : 0
      // The card as it was beside the form: turned toward the pointer (its own tilt), from there.
      const tilt = (f?.el.firstElementChild as HTMLElement | null)?.style.transform ?? ''
      const num = (fn: string, unit: string) => Number(tilt.match(new RegExp(`${fn}\\((-?[\\d.]+)${unit}\\)`))?.[1] ?? (fn === 'scale' ? 1 : 0))
      const lean = (rx: number, ry: number, ty: number, k: number, rz: number, sk: number) =>
        `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(${ty}px) scale(${k}) rotate(${rz}deg) skewX(${sk}deg)`
      const from0 = lean(num('rotateX', 'deg'), num('rotateY', 'deg'), num('translateY', 'px'), num('scale', ''), 0, 0)

      // One continuous score (ms, played SLOW times longer), nothing waits for anything: the card
      // lifts from its place and arcs up over the envelope rising under it, comes straight down into
      // it, the flap closes over it as it lands, and the sealed envelope goes on down into the drawer.
      const T = 4250
      const SLOW = 1.3
      const CARD_END = 1500
      const FLAP = 1250
      // The drawer: it slides out as the flap comes down, ours lands in it at LAND, and after a beat it
      // slides back in, all of it (its last line too).
      const OPEN: [number, number] = [2550, 2950]
      // Closed, it is taken up as if in a hand (TURN: lifted from, held, let go), the sticker put on
      // while it is held, and it goes down into the drawer.
      const TURN: [number, number, number] = [2000, 2650, 2650]
      const DROP = TURN[2]
      const LAND = 3500
      // As it lands the drawer starts in, slowly at first (it never stops), and goes in.
      const SHUT: [number, number] = [LAND - 50, LAND + 650]
      const o = (ms: number) => ms / T
      const opts = { duration: T * SLOW, fill: 'forwards' as const }
      // The card's path: a curve from its place, up over the opening, ending straight down into it
      // (so it is square over the opening well before it goes in). Sampled finely, timed by one easing.
      const top = inY - rise - rise * 0.3
      const P = [
        [sx, sy],
        [cx, Math.min(sy, top)],
        [cx, top],
        [cx, inY],
      ]
      const bez = (t: number, i: number) => (1 - t) ** 3 * P[0][i] + 3 * (1 - t) ** 2 * t * P[1][i] + 3 * (1 - t) * t ** 2 * P[2][i] + t ** 3 * P[3][i]
      const N = 64
      const path = Array.from({ length: N + 1 }, (_, i) => {
        // A soft ease (sine), so it is under way at once and comes to rest as it lands.
        const t = 0.5 - 0.5 * Math.cos(Math.PI * (i / N))
        const k = Math.min(1, t / 0.6)
        return { x: bez(t, 0), y: bez(t, 1), s: ss + (sc - ss) * (k * k * (3 - 2 * k)), t, at: (i / N) * CARD_END }
      })
      // It goes behind the envelope's front at the top of its arc (wholly above the opening then).
      const peak = path.reduce((m, q, i) => (q.y < path[m].y ? i : m), 0)
      const card = el.animate(
        [
          ...path.map((q, i) => ({
            transform: at(q.x, q.y, q.s),
            clipPath: `inset(0 0 ${(folded * (1 - Math.min(1, q.t / 0.3))).toFixed(1)}px 0)`,
            zIndex: i <= peak ? 5 : 2,
            offset: o(q.at),
          })),
          { transform: at(cx, inY, sc), clipPath: 'inset(0 0 0px 0)', zIndex: 2, offset: 1 },
        ],
        opts,
      )
      // Carried, the card isn't rigid: one soft lean as it is lifted, settling as it goes in; the light
      // slides across it.
      const sheet = el.firstElementChild as HTMLElement | null
      const sway = sheet?.animate(
        [
          { transform: from0, offset: 0, easing: EASE },
          { transform: lean(0, 0, 0, 1, -1, 0.4), offset: o(500), easing: EASE },
          { transform: lean(0, 0, 0, 1, 0, 0), offset: o(1200) },
          { transform: lean(0, 0, 0, 1, 0, 0), offset: 1 },
        ],
        opts,
      )
      const light = el.animate(
        [
          { '--sheen': '15%', offset: 0 },
          { '--sheen': '70%', offset: o(900) },
          { '--sheen': '30%', offset: o(CARD_END) },
          { '--sheen': '30%', offset: 1 },
        ] as Keyframe[],
        opts,
      )
      // The envelope comes up under it while it is still on its way, in place before it comes down.
      const upAt = path[peak].at
      const UP: [number, number] = [Math.max(0, upAt - 800), Math.max(300, upAt - 40)]
      const env = [
        { transform: at(ex, vh + 60, sc), offset: 0 },
        { transform: at(ex, vh + 60, sc), offset: o(UP[0]), easing: EASE_OUT },
        { transform: at(ex, ey, sc), offset: o(UP[1]) },
        { transform: at(ex, ey, sc), offset: 1 },
      ]
      const parts = [back.current, pocket.current, seal.current].map((p) => p?.animate(env, opts))
      // Open while the card goes in; it closes over it as it lands, bending as it comes (its tip lags
      // and catches up, as a page does), turned each frame below.
      const flapClose = flap.current?.animate(
        [
          { transform: flapAt(ex, vh + 60 + fh * sc, 0, ew, sc), offset: 0 },
          { transform: flapAt(ex, vh + 60 + fh * sc, 0, ew, sc), offset: o(UP[0]), easing: EASE_OUT },
          { transform: flapAt(ex, ey, 0, ew, sc), offset: o(UP[1]) },
          { transform: flapAt(ex, ey, 0, ew, sc), offset: 1 },
        ],
        opts,
      )
      const flapLeaf = flap.current?.querySelector<HTMLElement>('[data-leaf]')
      const flapFlat = flap.current?.querySelector<HTMLElement>('[data-flap-flat]')
      const FLAP_MS = 750
      // As the flap lies down, the sticker goes on (turned each frame below); the light on its foil
      // moves only as the envelope (and the sticker itself) turns.
      // Soon after the flap is down, as it is held up, the sticker goes on.
      const STICK: [number, number] = [FLAP + FLAP_MS + 250, FLAP + FLAP_MS + 730]
      const sticker = seal.current?.querySelector<HTMLElement>('[data-sticker]')
      const stickerLeaf = sticker?.querySelector<HTMLElement>('[data-leaf]')
      const foil = [...(sticker?.querySelectorAll<HTMLElement>('[data-foil]') ?? [])]
      // Sealed, it goes straight on down into the drawer between its two nearest lines (everything
      // below them is cut off), coming to rest a little askew, its top showing. There the drawer takes
      // it over (drawn the same), so it can go in with it.
      const ox = ex + (ew * sc) / 2
      const oy = ey + (eh * sc) / 2
      g.style.transformOrigin = `${ox}px ${oy}px`
      const dropY = baseY - tops - ey
      // Closed, it is picked up: lifted a little, tipped back and turned a touch, as a hand holds it
      // to put the sticker on (the foil catching the light); then it is let go down into the drawer,
      // coming straight as it goes.
      const pose = (y: number, rx: number, ry: number, rz = 0) => `translateY(${y}px) perspective(1600px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rz}deg)`
      const rest = pose(dropY, 0, 0, OURS_TILT)
      const post = g.animate(
        [
          { transform: pose(0, 0, 0), visibility: 'visible', offset: 0 },
          { transform: pose(0, 0, 0), visibility: 'visible', offset: o(TURN[0]), easing: 'cubic-bezier(0.45, 0, 0.4, 1)' },
          // Taken up, turning, as the sticker goes on; then straight down into the drawer: one move up, one down.
          { transform: pose(-82, 14, -7, -4), visibility: 'visible', offset: o(TURN[1]), easing: 'cubic-bezier(0.45, 0, 0.35, 1)' },
          { transform: rest, visibility: 'visible', offset: o(LAND) },
          { transform: rest, visibility: 'visible', offset: o(LAND + 20) },
          { transform: rest, visibility: 'hidden', offset: o(LAND + 21) },
          { transform: rest, visibility: 'hidden', offset: 1 },
        ],
        opts,
      )
      const cutAt = window.setTimeout(() => (c.style.height = `${baseY}px`), o(DROP) * T * SLOW)
      // The drawer, drawn each frame from the score: opened `p` of the way, every line sits as deep
      // as it would p times over (so the rails stay straight and the vanishing point stays put).
      const mid = innerWidth / 2
      const q = <E extends Element>(sel: string) => [...dr.querySelectorAll<E>(sel)]
      const majors = q<SVGLineElement>('[data-major]')
      const rails = q<SVGLineElement>('[data-rail]')
      const ticks = q<SVGLineElement>('[data-tick]')
      const set = (n: Element, a: Record<string, number | string>) => Object.entries(a).forEach(([k, v]) => n.setAttribute(k, typeof v === 'number' ? v.toFixed(2) : v))
      const yAt = (u: number) => slotY - vp * (1 - fz(u))
      const halfAt = (u: number) => (slotW / 2) * fz(u)
      // The envelopes standing in it: each drawn as ours is (the same layers, at its scale), cut at its
      // line. Laid out as when open; while the drawer is part open, each is drawn in toward the middle
      // and pressed down to its line (as deep again times p, as the lines are).
      const stands = [...st.querySelectorAll<HTMLElement>('[data-stand]')].map((wrap) => {
        const env = wrap.firstElementChild as HTMLElement
        Object.assign(env.style, { width: `${ew}px`, height: `${eh}px` })
        ;(env.querySelector('[data-closed-flap]') as HTMLElement).style.height = `${fh}px`
        const ours = wrap.dataset.stand === 'ours'
        const [u, ws, hs] = ['u', 'ws', 'hs'].map((k) => Number(wrap.dataset[k]))
        let pose: string
        if (ours) {
          // Exactly where the real one came to rest (turned about its middle), so taking over shows nothing.
          pose = `translate(${ox}px, ${oy + dropY}px) rotate(${OURS_TILT}deg) translate(${-ox}px, ${-oy}px) translate(${ex}px, ${ey}px) scale(${sc})`
        } else {
          // A little out of line, differently each time.
          const dx = (Math.random() * 2 - 1) * JITTER_SHIFT
          const tilt = (Math.random() * 2 - 1) * JITTER_TURN
          const w = ws * 2 * halfAt(u)
          const h = (tops / fz(OURS_U)) * hs * fz(u)
          pose = `translate(${mid + dx * 2 * halfAt(u)}px, ${yAt(u)}px) rotate(${tilt}deg) translate(${-w / 2}px, ${-h}px) scale(${w / ew})`
        }
        return { wrap, env, ours, u, pose }
      })
      let raf = 0
      const draw = () => {
        const ms = Number(post.currentTime ?? 0) / SLOW
        // How far out it is: the ruler slides, its steps keeping their spacing, so a line k steps in sits
        // k - shift deep (shown once it is past the slot line). Shut, it goes a touch past, so its last
        // line is gone too.
        const p = ms < OPEN[1] ? easeInOut(span(ms, ...OPEN)) : 1 - 1.03 * easeIn(span(ms, ...SHUT))
        // The sticker: its top down first, the rest smoothed on after it.
        if (sticker && stickerLeaf) {
          const sp = span(ms, ...STICK)
          sticker.style.visibility = ms >= STICK[0] ? 'visible' : 'hidden'
          const se = easeOut(sp)
          const press = 70 * (1 - se)
          bendLeaf(stickerLeaf, press, Math.sin(Math.PI * se) * 45)
          // The light on the foil, from how the envelope (and the sticker on it) is turned right now.
          const m = new DOMMatrix(getComputedStyle(g).transform)
          const ry = (Math.asin(Math.max(-1, Math.min(1, m.m13))) * 180) / Math.PI
          const rx = (Math.asin(Math.max(-1, Math.min(1, -m.m23))) * 180) / Math.PI
          const pos = `0 0, ${(50 - ry * 7).toFixed(1)}% ${(50 + (rx + press * 0.3) * 4).toFixed(1)}%`
          foil.forEach((f) => (f.style.backgroundPosition = pos))
        }
        const shift = DRAWER_UNITS * (1 - p)
        dr.style.visibility = ms >= OPEN[0] ? 'visible' : 'hidden'
        // The flap: open (stood up behind) until it closes; behind the card while more than upright.
        const fp = span(ms, FLAP, FLAP + FLAP_MS)
        const fa = 180 * (0.5 + 0.5 * Math.cos(Math.PI * fp))
        if (flapLeaf) bendLeaf(flapLeaf, fa, Math.sin(Math.PI * fp) * 60)
        // Closed, the flat flap stands in for the strips.
        const flat = fa < 0.05
        if (flapLeaf) flapLeaf.style.visibility = flat ? 'hidden' : ''
        if (flapFlat) flapFlat.style.visibility = flat ? 'inherit' : 'hidden'
        if (flap.current) flap.current.style.zIndex = fa > 90 ? '1' : '4'
        // Lighter the further away it is.
        const line = (ln: SVGLineElement, d: number, x1: number, x2: number, tone = 1) =>
          set(ln, { x1, x2, y1: yAt(d), y2: yAt(d), 'stroke-opacity': tone / (1 + Math.max(0, d) * 0.12), visibility: d >= 0 ? 'inherit' : 'hidden' })
        majors.forEach((ln) => {
          const d = Number(ln.dataset.major) - shift
          line(ln, d, mid - halfAt(d), mid + halfAt(d))
        })
        rails.forEach((ln) => {
          const side = Number(ln.dataset.rail)
          const back = DRAWER_UNITS - shift
          set(ln, { x1: mid + side * halfAt(0), x2: mid + side * halfAt(back), y1: yAt(0), y2: yAt(back), visibility: back > 0 ? 'inherit' : 'hidden' })
        })
        ticks.forEach((ln) => {
          const d = Number(ln.dataset.tick) - shift
          const side = Number(ln.dataset.side)
          const edge = mid + side * halfAt(d)
          line(ln, d, edge, edge - side * Number(ln.dataset.len) * DRAWER_TICK * 2 * halfAt(d), 0.85)
        })
        // The envelopes ride in it, rising out of the slot line and going back under it.
        stands.forEach(({ wrap, env, ours, u, pose }) => {
          const d = u - shift
          const by = yAt(d)
          const k = fz(d) / fz(u)
          wrap.style.visibility = ms >= OPEN[0] && d > -1.5 && (!ours || ms >= LAND) ? 'visible' : 'hidden'
          wrap.style.clipPath = `inset(0 0 calc(100% - ${Math.min(by, slotY).toFixed(2)}px) 0)`
          env.style.transform = `translate(${mid}px, ${by}px) scale(${k}) translate(${-mid}px, ${-yAt(u)}px) ${pose}`
        })
        raf = requestAnimationFrame(draw)
      }
      raf = requestAnimationFrame(draw)
      // As the drawer goes in, the thanks' check comes up out of it (drawn back out of the depth).
      const shutAt = window.setTimeout(() => shut.current({ x: mid, y: slotY }), (o(SHUT[0] + 380) * T * SLOW))
      post.onfinish = () => done.current()
      return () => {
        clearTimeout(cutAt)
        clearTimeout(shutAt)
        cancelAnimationFrame(raf)
        ;[card, sway, light, flapClose, post, ...parts].forEach((a) => a?.cancel())
      }
    }
    let live = true
    let stop: (() => void) | undefined
    const imgs = [...el.querySelectorAll('img')]
    Promise.all(imgs.map((i) => i.decode().catch(() => undefined))).then(() => {
      if (!live) return
      stop = run()
      start.current()
    })
    return () => {
      live = false
      stop?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      {/* The drawer, behind the envelope coming down into it (drawn each frame). */}
      <svg ref={drawer} className="absolute inset-0 size-full" style={{ visibility: 'hidden' }}>
        <g stroke="rgb(150 147 141)" strokeWidth={0.9} fill="none">
          {Array.from({ length: DRAWER_UNITS + 1 }, (_, u) => (
            <line key={u} data-major={u} />
          ))}
          {[-1, 1].map((side) => (
            <line key={side} data-rail={side} />
          ))}
          {Array.from({ length: DRAWER_UNITS }, (_, k) =>
            DRAWER_TICKS.flatMap(([d, len]) =>
              [-1, 1].map((side) => <line key={`${k + d}${side}`} data-tick={k + d} data-side={side} data-len={len} />),
            ),
          )}
        </g>
      </svg>
      {/* The envelopes in it, the farthest first (ours, at the front, last), each cut at its line. */}
      <div ref={standing} className="absolute inset-0">
        {[...DRAWER_ENVELOPES].reverse().concat([[OURS_U, OURS_SHARE, 1]]).map(([u, ws, hs], i, all) => (
          <div key={u} data-stand={i === all.length - 1 ? 'ours' : 'past'} data-u={u} data-ws={ws} data-hs={hs} className="absolute inset-0" style={{ visibility: 'hidden' }}>
            <ClosedEnvelope division={division} />
          </div>
        ))}
      </div>
      <div ref={clip} className="absolute inset-x-0 top-0 h-full overflow-hidden">
        {/* The envelope and the card in it move as one once it is sealed. */}
        <div ref={group} className="absolute inset-0">
          <Envelope division={division} back={back} pocket={pocket} flap={flap} seal={seal} />
          <div ref={box} className="absolute left-0 top-0 z-[2] origin-top-left" style={{ transform: 'translateY(200vh)' }}>
            {front}
          </div>
        </div>
      </div>
    </div>
  )
}
