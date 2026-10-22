'use client'

/**
 * The application card's two moments, on heavy letterpress paper.
 * - CardOpening: the page opens on the card growing in, in the middle of the screen, turning
 *   slightly as it comes, its back showing (the application's headline). It turns over: beside
 *   the form it becomes the comp card (desktop); on phones it turns to the folded strip and
 *   shrinks into it, so it is the strip.
 * - CardPost: once the application is sent, the card comes to the middle, an open envelope rises
 *   under it, the card goes in, the flap closes, and the envelope drops into a drawer (seen from
 *   above, among others' envelopes) that shuts on it.
 * Both draw copies over the page (fixed), so the page under them lays itself out undisturbed.
 */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { DivisionMark } from '@/components/brand/Marks'
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
/** The flap: a short straight side at each end, then the two slopes to its tip (as a real one is cut). */
/** The flap in two parts, hinged across 55% of its height (so it can curve): its upper part, and its tip.
 * Each inside face is the same cut, upside down, because that face is itself turned over (rotateX) so it shows from behind. */
const FLAP_BASE = 'polygon(0 0, 100% 0, 100% 29.1%, 76.8% 100%, 23.2% 100%, 0 29.1%)'
const FLAP_BASE_INSIDE = 'polygon(0 100%, 100% 100%, 100% 70.9%, 76.8% 0, 23.2% 0, 0 70.9%)'
const FLAP_TIP = 'polygon(23.2% 0, 76.8% 0, 50% 100%)'
const FLAP_TIP_INSIDE = 'polygon(23.2% 100%, 76.8% 100%, 50% 0)'
/** Off screen until the animation places it. */
const OFF = { transform: 'translateY(300vh)' } as const

/** Ink pressed into the paper: dark, with the light catching the lower lip of the impression. */
const press = { textShadow: '0 1px 0 rgb(255 255 255 / 0.75)' } as const
/** Blind deboss: no ink, just the shape pushed into the paper. */
const blind = { filter: 'drop-shadow(0 1px 0 rgb(255 255 255 / 0.95)) drop-shadow(0 -1px 0 rgb(0 0 0 / 0.18))', color: '#d6d3cb' } as const

/** The card's back: the application's headline, and nothing else to read. */
function Headline({ division }: { division: Division }) {
  const s = SITES[siteForDivision(division)]
  return (
    <div className="paper absolute inset-0 flex flex-col items-center p-[clamp(22px,2.6vw,40px)] text-center text-[#141414] [backface-visibility:hidden]" style={{ transform: 'rotateY(180deg)' }}>
      {/* The plate's impression, a hairline inside the edge. */}
      <span aria-hidden className="pointer-events-none absolute inset-[10px] shadow-[inset_0_1px_1px_rgb(0_0_0/0.07),inset_0_-1px_0_rgb(255_255_255/0.6)]" />
      {/* The mark at the top, the headline in the middle, the house at the foot. */}
      <span className="mt-[10%]" style={blind}>
        <DivisionMark division={division} size={30} />
      </span>
      <p className="wordmark my-auto text-[clamp(44px,4.8vw,72px)] uppercase leading-[0.92]" style={press}>
        Model
        <br />
        Application
      </p>
      <span className="mb-[4%] text-[9px] uppercase tracking-[0.42em] text-[#55534f]" style={press}>
        {s.brand} Model Management
      </span>
    </div>
  )
}

/** A classic envelope's three layers, placed by the caller: its inside, the pocket in front of the card, and the flap. */
function Envelope({ division, back, pocket, flap, tip }: { division: Division; back: React.Ref<HTMLDivElement>; pocket: React.Ref<HTMLDivElement>; flap: React.Ref<HTMLDivElement>; tip: React.Ref<HTMLDivElement> }) {
  return (
    <>
      {/* Inside, behind the card: the same stock, in shade. */}
      <div ref={back} style={OFF} className="envelope-paper absolute left-0 top-0 z-[1] origin-top-left shadow-[inset_0_0_0_999px_rgb(0_0_0/0.09),0_34px_44px_-30px_rgb(0_0_0/0.5),0_2px_6px_rgb(0_0_0/0.08)]" />
      {/* In front of the card: the back of the envelope, its side and bottom folds meeting under the flap. */}
      <div ref={pocket} style={OFF} className="absolute left-0 top-0 z-[3] origin-top-left [filter:drop-shadow(0_-1px_1px_rgb(0_0_0/0.12))]">
        <div className="envelope-paper absolute inset-0" style={{ clipPath: POCKET }}>
          {/* The side flaps in a little shade towards the folds, so they read as two sheets meeting. */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgb(0 0 0 / 0.045), transparent 30%, transparent 70%, rgb(0 0 0 / 0.045))' }} />
          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
            {/* The folds: from the bottom corners up to where the side flaps meet. */}
            <path d="M0 100 L46 62 M100 100 L54 62" stroke="rgb(0 0 0 / 0.1)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" fill="none" />
            <path d="M0 100.6 L46 62.6 M100 100.6 L54 62.6" stroke="rgb(255 255 255 / 0.7)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" fill="none" />
          </svg>
        </div>
      </div>
      {/* The flap: closed over the top, the mark pressed into its tip; it opens up and back, showing
          its inside. It is paper, so it curves as it moves: its tip (hinged to the rest across the
          middle) lags behind and catches up. */}
      <div ref={flap} style={OFF} className="absolute left-0 top-0 z-[4] origin-top [transform-style:preserve-3d]">
        <div className="absolute inset-x-0 top-0 h-[55%] [transform-style:preserve-3d]">
          <div className="absolute inset-0 [backface-visibility:hidden] [filter:drop-shadow(0_2px_2px_rgb(0_0_0/0.14))]">
            <div className="envelope-paper absolute inset-0" style={{ clipPath: FLAP_BASE }} />
          </div>
          <div className="envelope-paper absolute inset-0 [backface-visibility:hidden]" style={{ clipPath: FLAP_BASE_INSIDE, transform: 'rotateX(180deg)', boxShadow: 'inset 0 0 0 999px rgb(0 0 0 / 0.06)' }} />
        </div>
        <div ref={tip} className="absolute inset-x-0 top-[55%] h-[45%] origin-top [transform-style:preserve-3d]">
          <div className="absolute inset-0 [backface-visibility:hidden] [filter:drop-shadow(0_2px_2px_rgb(0_0_0/0.16))]">
            <div className="envelope-paper absolute inset-0" style={{ clipPath: FLAP_TIP }}>
              {/* Shaded towards its point, so it reads as a sheet folded over. */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.05))' }} />
            </div>
            <span className="absolute bottom-[31%] left-1/2 -translate-x-1/2" style={blind}>
              <DivisionMark division={division} size={26} />
            </span>
          </div>
          <div className="envelope-paper absolute inset-0 [backface-visibility:hidden]" style={{ clipPath: FLAP_TIP_INSIDE, transform: 'rotateX(180deg)', boxShadow: 'inset 0 0 0 999px rgb(0 0 0 / 0.06)' }} />
        </div>
      </div>
    </>
  )
}

/** A sealed envelope as ours is once its flap is down (the same layers and paper), standing in the drawer. */
function ClosedEnvelope({ division }: { division: Division }) {
  return (
    <div data-closed className="absolute left-0 top-0 origin-top-left">
      <div className="envelope-paper absolute inset-0 shadow-[inset_0_0_0_999px_rgb(0_0_0/0.09)]" />
      <div data-closed-flap className="absolute inset-x-0 top-0">
        <div className="absolute inset-x-0 top-0 h-[55%] [filter:drop-shadow(0_2px_2px_rgb(0_0_0/0.14))]">
          <div className="envelope-paper absolute inset-0" style={{ clipPath: FLAP_BASE }} />
        </div>
        <div className="absolute inset-x-0 top-[55%] h-[45%] [filter:drop-shadow(0_2px_2px_rgb(0_0_0/0.16))]">
          <div className="envelope-paper absolute inset-0" style={{ clipPath: FLAP_TIP }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.05))' }} />
          </div>
          <span className="absolute bottom-[31%] left-1/2 -translate-x-1/2" style={blind}>
            <DivisionMark division={division} size={26} />
          </span>
        </div>
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
const DRAWER_UNITS = 10
/** How far up the vanishing point is, against the drawer's width at the front (and at most against the screen's height). */
const DRAWER_RISE = 0.55
const DRAWER_RISE_MAX = 0.24
const fz = (u: number) => 1 / (1 + u * 0.22)
/** The inch ruler's ticks along both its edges between the whole steps: [depth within a step, length]. */
const DRAWER_TICKS: [number, number][] = [
  [0.25, 0.45],
  [0.5, 0.7],
  [0.75, 0.45],
]
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
  [6.5, 0.78, 1.1],
  [8.5, 0.76, 1],
]
const JITTER_SHIFT = 0.025
const JITTER_TURN = 1.2
/** Ours lands a touch askew too (deg). */
const OURS_TILT = -0.8
const easeOut = (t: number) => 1 - (1 - t) ** 3
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
  useLayoutEffect(() => {
    done.current = onDone
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

    // It grows in from small, unhurried, turning slightly as it comes; the headline is held a while
    // to be read; then it turns over (unhurried too) and goes to its place.
    const GROWN = 1300
    const TURN_FROM = 2400
    const TURN_END = TURN_FROM + 650
    const T = TURN_END + 850
    const o = (ms: number) => ms / T
    const opts = { duration: T, fill: 'forwards' as const }
    const card = el.animate(
      [
        { transform: place(fit * 0.55), clipPath: free, offset: 0, easing: EASE_OUT },
        { transform: place(fit), clipPath: free, offset: o(GROWN) },
        { transform: place(fit), clipPath: free, offset: o(TURN_END + 50), easing: EASE },
        { transform: at(tx, ty, zoom), clipPath: clipTo, offset: 1 },
      ],
      opts,
    )
    const turn = fl.animate(
      [
        // Straightening slowly the whole time it grows and is held, so it never snaps square.
        { transform: 'perspective(1800px) rotateZ(-7deg) rotateX(0deg) rotateY(180deg) skewY(0deg)', offset: 0, easing: 'cubic-bezier(0.3, 0.2, 0.5, 1)' },
        { transform: 'perspective(1800px) rotateZ(0deg) rotateX(0deg) rotateY(180deg) skewY(0deg)', offset: o(TURN_FROM), easing: 'cubic-bezier(0.5, 0, 0.6, 0.6)' },
        // Paper, not a board: it gives a little in the middle of the turn (lifting at a corner) and settles.
        { transform: 'perspective(1800px) rotateZ(1.2deg) rotateX(7deg) rotateY(95deg) skewY(-2deg)', offset: o((TURN_FROM + TURN_END) / 2), easing: 'cubic-bezier(0.3, 0.5, 0.3, 1)' },
        { transform: 'perspective(1800px) rotateZ(0deg) rotateX(-1.5deg) rotateY(-4deg) skewY(0deg)', offset: o(TURN_END - 60), easing: 'cubic-bezier(0.3, 0.6, 0.4, 1)' },
        { transform: 'perspective(1800px) rotateZ(0deg) rotateX(0deg) rotateY(0deg) skewY(0deg)', offset: o(TURN_END + 120) },
        { transform: 'perspective(1800px) rotateZ(0deg) rotateX(0deg) rotateY(0deg) skewY(0deg)', offset: 1 },
      ],
      opts,
    )
    // The light slides across the paper as it turns, and again as it is carried to its place.
    const light = el.animate(
      [
        { '--sheen': '20%', offset: 0 },
        { '--sheen': '20%', offset: o(TURN_FROM) },
        { '--sheen': '85%', offset: o(TURN_END) },
        { '--sheen': '35%', offset: 1 },
      ] as Keyframe[],
      opts,
    )
    // No fade: the stage is simply there, the card small and growing.
    if (stage.current) stage.current.style.opacity = '1'
    card.onfinish = () => done.current()
    // Skipping: everything jumps to its end (which also finishes the card, and so calls onDone).
    if (skipRef) skipRef.current = () => [turn, light, card].forEach((a) => a?.finish())
    return () => {
      if (skipRef) skipRef.current = null
      ;[card, turn, light].forEach((a) => a?.cancel())
    }
    // Plays once, from where the page is when it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={stage} aria-hidden className="pointer-events-none fixed inset-0 z-30" style={{ opacity: 0 }}>
      <div ref={box} className="absolute left-0 top-0 origin-top-left">
        <div ref={flip} className="relative [transform-style:preserve-3d]">
          <div data-face className="relative [backface-visibility:hidden]">
            <div ref={desk}>{front}</div>
            <div ref={phone}>{compact}</div>
          </div>
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
  onDone,
}: {
  front: React.ReactNode
  division: Division
  from: () => Place
  onDone: () => void
}) {
  const clip = useRef<HTMLDivElement>(null)
  const group = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const back = useRef<HTMLDivElement>(null)
  const pocket = useRef<HTMLDivElement>(null)
  const flap = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const drawer = useRef<SVGSVGElement>(null)
  const standing = useRef<HTMLDivElement>(null)
  const done = useRef(onDone)
  useLayoutEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    const el = box.current
    const c = clip.current
    const dr = drawer.current
    const st = standing.current
    const g = group.current
    if (!el || !c || !dr || !st || !g) return
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

    // First the card alone, whole in the middle of the screen.
    const vh = window.visualViewport?.height ?? innerHeight
    const show = Math.min(1, (vh * 0.55) / h, (innerWidth - 48) / w)
    const showAt = at((innerWidth - w * show) / 2, (vh - h * show) / 2, show)
    // Then the envelope, small, low in the middle; the card above it, then in it; the slot under it.
    const sc = envScale(ew, eh, fh)
    const ex = (innerWidth - ew * sc) / 2
    const spare = Math.max(0, vh - ENV_TOP - ENV_FOOT - (eh + fh) * sc)
    const ey = ENV_TOP + fh * sc + spare * 0.55
    const cx = ex + pad * sc
    const inY = ey + pad * sc
    // It waits wholly above the envelope's opening (in front of the open flap), then slides down into it.
    const rise = Math.max(0, Math.min(h * sc + pad * sc + 6, inY - 60))
    // The drawer under it: its front edge (the slot line) low enough that its back clears the
    // envelope; wide enough that ours fills its share of it where it goes in.
    const slotW = (ew * sc) / (OURS_SHARE * fz(OURS_U))
    const vp = Math.min(slotW * DRAWER_RISE, vh * DRAWER_RISE_MAX)
    const tops = vp * OURS_SHOW
    const slotY = Math.round(Math.min(vh - 28, ey + eh * sc + vp * (1 - fz(DRAWER_UNITS)) + 14))
    const baseY = slotY - vp * (1 - fz(OURS_U))
    // Where it comes from: the card beside the form, or (phones) the strip, the card folded under it.
    const fromAt = r ? at(r.left, r.top, desk ? zoom : r.width / w) : at((innerWidth - w) / 2, vh + 20, 1)
    const fromClip = !desk && r ? `inset(0 0 ${Math.max(0, h - r.height / (r.width / w))}px 0)` : 'inset(0 0 0 0)'
    const open = 'inset(0 0 0 0)'

    // Timed on a 3.3s score, played unhurried (SLOW times longer).
    // The score (ms, played SLOW times longer): the card alone in the middle; then it settles, small,
    // where the envelope's opening will be (in front of everything); only then does the envelope
    // rise to meet it, and the card goes in. Sealed, it goes through the slot.
    const T = 4080
    const SLOW = 1.3
    // The drawer: it opens as the flap comes down, ours lands in it at LAND, and it shuts after a beat;
    // as its lines come together its last one draws in to nothing (GO).
    const OPEN: [number, number] = [2150, 2480]
    const LAND = 3200
    const SHUT: [number, number] = [3600, 3930]
    const GO: [number, number] = [3640, 3990]
    const o = (ms: number) => ms / T
    const opts = { duration: T * SLOW, fill: 'forwards' as const }
    const card = el.animate(
      [
        { transform: fromAt, clipPath: fromClip, zIndex: 5, offset: 0, easing: EASE },
        { transform: showAt, clipPath: open, zIndex: 5, offset: o(600) },
        { transform: showAt, clipPath: open, zIndex: 5, offset: o(800), easing: EASE },
        { transform: at(cx, inY - rise, sc), clipPath: open, zIndex: 2, offset: o(1150) },
        { transform: at(cx, inY - rise, sc), clipPath: open, zIndex: 2, offset: o(1600), easing: EASE },
        { transform: at(cx, inY, sc), clipPath: open, zIndex: 2, offset: o(1950) },
        { transform: at(cx, inY, sc), clipPath: open, zIndex: 2, offset: 1 },
      ],
      opts,
    )
    // Carried, the card isn't rigid: it sways a little as it moves and settles when it stops, and the
    // light slides across it.
    const sheet = el.firstElementChild as HTMLElement | null
    const sway = sheet?.animate(
      [
        // One soft lean as it is lifted, and back, each time it is moved (no swinging to and fro).
        { transform: 'rotate(0deg) skewX(0deg)', offset: 0, easing: EASE },
        { transform: 'rotate(-1deg) skewX(0.4deg)', offset: o(300), easing: EASE },
        { transform: 'rotate(0deg) skewX(0deg)', offset: o(700) },
        { transform: 'rotate(0deg) skewX(0deg)', offset: o(800), easing: EASE },
        { transform: 'rotate(0.7deg) skewX(-0.3deg)', offset: o(1000), easing: EASE },
        { transform: 'rotate(0deg) skewX(0deg)', offset: o(1250) },
        { transform: 'rotate(0deg) skewX(0deg)', offset: o(1600), easing: EASE },
        { transform: 'rotate(-0.4deg) skewX(0.2deg)', offset: o(1780), easing: EASE },
        { transform: 'rotate(0deg) skewX(0deg)', offset: o(1950) },
        { transform: 'rotate(0deg) skewX(0deg)', offset: 1 },
      ],
      opts,
    )
    const light = el.animate(
      [
        { '--sheen': '15%', offset: 0 },
        { '--sheen': '70%', offset: o(600) },
        { '--sheen': '70%', offset: o(800) },
        { '--sheen': '30%', offset: o(1150) },
        { '--sheen': '30%', offset: 1 },
      ] as Keyframe[],
      opts,
    )
    const env = [
      { transform: at(ex, vh + 60, sc), offset: 0 },
      { transform: at(ex, vh + 60, sc), offset: o(1150), easing: EASE },
      { transform: at(ex, ey, sc), offset: o(1550) },
      { transform: at(ex, ey, sc), offset: 1 },
    ]
    const parts = [back.current, pocket.current].map((p) => p?.animate(env, opts))
    // Once the drawer opens there is no wall behind it to throw a shadow on: the envelope's goes.
    const inset = 'inset 0 0 0 999px rgb(0 0 0 / 0.09)'
    const unshadow = back.current?.animate(
      [
        { boxShadow: `${inset}, 0 34px 44px -30px rgb(0 0 0 / 0.5), 0 2px 6px rgb(0 0 0 / 0.08)`, offset: 0 },
        { boxShadow: `${inset}, 0 34px 44px -30px rgb(0 0 0 / 0.5), 0 2px 6px rgb(0 0 0 / 0.08)`, offset: o(OPEN[0]) },
        { boxShadow: `${inset}, 0 34px 44px -30px rgb(0 0 0 / 0), 0 2px 6px rgb(0 0 0 / 0)`, offset: o(OPEN[1]) },
        { boxShadow: `${inset}, 0 34px 44px -30px rgb(0 0 0 / 0), 0 2px 6px rgb(0 0 0 / 0)`, offset: 1 },
      ],
      opts,
    )
    // Open while the card goes in; it closes over it.
    const flapClose = flap.current?.animate(
      [
        { transform: flapAt(ex, vh + 60 + fh * sc, 180, ew, sc), zIndex: 1, offset: 0 },
        { transform: flapAt(ex, vh + 60 + fh * sc, 180, ew, sc), zIndex: 1, offset: o(1150), easing: EASE },
        { transform: flapAt(ex, ey, 180, ew, sc), zIndex: 1, offset: o(1550) },
        { transform: flapAt(ex, ey, 180, ew, sc), zIndex: 1, offset: o(1970), easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
        { transform: flapAt(ex, ey, 90, ew, sc), zIndex: 1, offset: o(2130) },
        { transform: flapAt(ex, ey, 90, ew, sc), zIndex: 4, offset: o(2131), easing: 'cubic-bezier(0.3, 0.5, 0.4, 1)' },
        // Paper: it comes down a touch past flat, and lies down.
        { transform: flapAt(ex, ey, -6, ew, sc), zIndex: 4, offset: o(2270), easing: 'cubic-bezier(0.3, 0.6, 0.4, 1)' },
        { transform: flapAt(ex, ey, 0, ew, sc), zIndex: 4, offset: o(2340) },
        { transform: flapAt(ex, ey, 0, ew, sc), zIndex: 4, offset: 1 },
      ],
      opts,
    )
    // As the flap comes down over the card, its tip lags, so the flap curves, and catches up as it lies down.
    const tipBend = tip.current?.animate(
      [
        { transform: 'rotateX(0deg)', offset: 0 },
        { transform: 'rotateX(0deg)', offset: o(2131), easing: 'cubic-bezier(0.3, 0.5, 0.4, 1)' },
        { transform: 'rotateX(20deg)', offset: o(2210), easing: 'cubic-bezier(0.3, 0.6, 0.4, 1)' },
        { transform: 'rotateX(-5deg)', offset: o(2300), easing: 'cubic-bezier(0.3, 0.6, 0.4, 1)' },
        { transform: 'rotateX(0deg)', offset: o(2390) },
        { transform: 'rotateX(0deg)', offset: 1 },
      ],
      opts,
    )
    // Sealed, it is lifted a touch, then lowered in one smooth move into the drawer between its two
    // nearest lines (everything below them is cut off), coming to rest a little askew, its top
    // showing. There the drawer takes it over (drawn the same), so it can lean back and shut with it.
    const ox = ex + (ew * sc) / 2
    const oy = ey + (eh * sc) / 2
    g.style.transformOrigin = `${ox}px ${oy}px`
    const dropY = baseY - tops - ey
    const rest = `translateY(${dropY}px) rotate(${OURS_TILT}deg)`
    const post = g.animate(
      [
        { transform: 'none', visibility: 'visible', offset: 0 },
        { transform: 'none', visibility: 'visible', offset: o(2380), easing: 'cubic-bezier(0.45, 0, 0.55, 1)' },
        { transform: 'translateY(-6px) rotate(-0.5deg)', visibility: 'visible', offset: o(2650), easing: 'cubic-bezier(0.5, 0, 0.25, 1)' },
        { transform: rest, visibility: 'visible', offset: o(LAND) },
        { transform: rest, visibility: 'visible', offset: o(LAND + 20) },
        { transform: rest, visibility: 'hidden', offset: o(LAND + 21) },
        { transform: rest, visibility: 'hidden', offset: 1 },
      ],
      opts,
    )
    const cutAt = window.setTimeout(() => (c.style.height = `${baseY}px`), o(2600) * T * SLOW)
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
      const p = ms < OPEN[1] ? easeOut(span(ms, ...OPEN)) : 1 - easeInOut(span(ms, ...SHUT))
      dr.style.visibility = ms >= OPEN[0] ? 'visible' : 'hidden'
      // Shutting, it draws in to its middle as it goes, so the last line is gone with it.
      dr.style.transform = st.style.transform = `scaleX(${(1 - easeInOut(span(ms, ...GO))).toFixed(4)})`
      const flat = p < 0.002
      majors.forEach((ln) => {
        const k = Number(ln.dataset.major)
        const u = k * p
        set(ln, { x1: mid - halfAt(u), x2: mid + halfAt(u), y1: yAt(u), y2: yAt(u), visibility: flat && k > 0 ? 'hidden' : 'inherit' })
      })
      rails.forEach((ln) => {
        const side = Number(ln.dataset.rail)
        const back = DRAWER_UNITS * p
        set(ln, { x1: mid + side * halfAt(0), x2: mid + side * halfAt(back), y1: yAt(0), y2: yAt(back), visibility: flat ? 'hidden' : 'inherit' })
      })
      ticks.forEach((ln) => {
        const u = Number(ln.dataset.tick) * p
        const side = Number(ln.dataset.side)
        const edge = mid + side * halfAt(u)
        set(ln, { x1: edge, x2: edge - side * Number(ln.dataset.len) * DRAWER_TICK * 2 * halfAt(u), y1: yAt(u), y2: yAt(u), visibility: flat ? 'hidden' : 'inherit' })
      })
      stands.forEach(({ wrap, env, ours, u, pose }) => {
        const by = yAt(u * p)
        const kx = fz(u * p) / fz(u)
        wrap.style.visibility = p > 0.01 && (!ours || ms >= LAND) ? 'visible' : 'hidden'
        wrap.style.clipPath = `inset(0 0 calc(100% - ${by.toFixed(2)}px) 0)`
        env.style.transform = `translate(${mid}px, ${by}px) scale(${kx}, ${kx * p}) translate(${-mid}px, ${-yAt(u)}px) ${pose}`
      })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    post.onfinish = () => done.current()
    return () => {
      clearTimeout(cutAt)
      cancelAnimationFrame(raf)
      ;[card, sway, light, flapClose, tipBend, post, unshadow, ...parts].forEach((a) => a?.cancel())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      {/* The drawer, behind the envelope coming down into it (drawn each frame). */}
      <svg ref={drawer} className="absolute inset-0 size-full origin-center" style={{ visibility: 'hidden' }}>
        <g stroke="rgb(150 147 141)" strokeWidth={0.9} fill="none">
          {Array.from({ length: DRAWER_UNITS + 1 }, (_, u) => (
            <line key={u} data-major={u} strokeOpacity={(1 / (1 + u * 0.12)).toFixed(3)} />
          ))}
          {[-1, 1].map((side) => (
            <line key={side} data-rail={side} />
          ))}
          {Array.from({ length: DRAWER_UNITS }, (_, k) =>
            DRAWER_TICKS.flatMap(([d, len]) =>
              [-1, 1].map((side) => <line key={`${k + d}${side}`} data-tick={k + d} data-side={side} data-len={len} strokeOpacity={(0.85 / (1 + (k + d) * 0.12)).toFixed(3)} />),
            ),
          )}
        </g>
      </svg>
      {/* The envelopes in it, the farthest first (ours, at the front, last), each cut at its line. */}
      <div ref={standing} className="absolute inset-0 origin-center">
        {[...DRAWER_ENVELOPES].reverse().concat([[OURS_U, OURS_SHARE, 1]]).map(([u, ws, hs], i, all) => (
          <div key={u} data-stand={i === all.length - 1 ? 'ours' : 'past'} data-u={u} data-ws={ws} data-hs={hs} className="absolute inset-0" style={{ visibility: 'hidden' }}>
            <ClosedEnvelope division={division} />
          </div>
        ))}
      </div>
      <div ref={clip} className="absolute inset-x-0 top-0 h-full overflow-hidden">
        {/* The envelope and the card in it move as one once it is sealed. */}
        <div ref={group} className="absolute inset-0">
          <Envelope division={division} back={back} pocket={pocket} flap={flap} tip={tip} />
          <div ref={box} className="absolute left-0 top-0 z-[2] origin-top-left" style={{ transform: 'translateY(200vh)' }}>
            {front}
          </div>
        </div>
      </div>
    </div>
  )
}
