'use client'

/**
 * The application card's two moments, on heavy letterpress paper.
 * - CardOpening: the page opens on the card growing in, in the middle of the screen, turning
 *   slightly as it comes, its back showing (the application's headline). It turns over: beside
 *   the form it becomes the comp card (desktop); on phones it turns to the folded strip and
 *   shrinks into it, so it is the strip.
 * - CardPost: once the application is sent, the card comes to the middle, an open envelope rises
 *   under it, the card goes in, the flap closes, and the envelope drops through a slot.
 * Both draw copies over the page (fixed), so the page under them lays itself out undisturbed.
 */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { DivisionMark } from '@/components/brand/Marks'
import { SITES, siteForDivision } from '@/lib/sites'
import type { Division } from '@/sanity/lib/types'

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
const EASE_OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)'
const EASE_IN = 'cubic-bezier(0.55, 0, 0.9, 0.5)'
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
const FLAP = 'polygon(0 0, 100% 0, 100% 16%, 50% 100%, 0 16%)'
/** The flap's inside: the same cut, upside down, because that face is itself turned over (rotateX) so it shows from behind. */
const FLAP_INSIDE = 'polygon(0 100%, 100% 100%, 100% 84%, 50% 0, 0 84%)'
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
function Envelope({ division, back, pocket, flap }: { division: Division; back: React.Ref<HTMLDivElement>; pocket: React.Ref<HTMLDivElement>; flap: React.Ref<HTMLDivElement> }) {
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
      {/* The flap: closed over the top, the mark pressed into its tip; it opens up and back, showing its inside. */}
      <div ref={flap} style={OFF} className="absolute left-0 top-0 z-[4] origin-top [transform-style:preserve-3d]">
        <div className="absolute inset-0 [backface-visibility:hidden] [filter:drop-shadow(0_2px_2px_rgb(0_0_0/0.16))]">
          <div className="envelope-paper absolute inset-0" style={{ clipPath: FLAP }}>
            {/* Shaded towards its tip, so it reads as a sheet folded over. */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, rgb(0 0 0 / 0.05))' }} />
          </div>
          <span className="absolute bottom-[14%] left-1/2 -translate-x-1/2" style={blind}>
            <DivisionMark division={division} size={26} />
          </span>
        </div>
        <div className="envelope-paper absolute inset-0 [backface-visibility:hidden]" style={{ clipPath: FLAP_INSIDE, transform: 'rotateX(180deg)', boxShadow: 'inset 0 0 0 999px rgb(0 0 0 / 0.07)' }} />
      </div>
    </>
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
/** Clear of the top bar above, and room for the slot below. */
const ENV_TOP = 96
const ENV_FOOT = 90
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

export function CardPost({ front, division, from, onDone }: { front: React.ReactNode; division: Division; from: () => Place; onDone: () => void }) {
  const clip = useRef<HTMLDivElement>(null)
  const group = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const back = useRef<HTMLDivElement>(null)
  const pocket = useRef<HTMLDivElement>(null)
  const flap = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLDivElement>(null)
  const shade = useRef<HTMLDivElement>(null)
  const done = useRef(onDone)
  useLayoutEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    const el = box.current
    const c = clip.current
    const st = slot.current
    const g = group.current
    if (!el || !c || !st || !g) return
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
    const slotY = Math.round(Math.min(vh - 28, ey + eh * sc + 46))
    const slotW = Math.round(ew * sc * 1.08)
    st.style.top = `${slotY}px`
    st.style.width = `${slotW}px`
    // Where it comes from: the card beside the form, or (phones) the strip, the card folded under it.
    const fromAt = r ? at(r.left, r.top, desk ? zoom : r.width / w) : at((innerWidth - w) / 2, vh + 20, 1)
    const fromClip = !desk && r ? `inset(0 0 ${Math.max(0, h - r.height / (r.width / w))}px 0)` : 'inset(0 0 0 0)'
    const open = 'inset(0 0 0 0)'

    // Timed on a 3.3s score, played unhurried (SLOW times longer).
    // The score (ms, played SLOW times longer): the card alone in the middle; then it settles, small,
    // where the envelope's opening will be (in front of everything); only then does the envelope
    // rise to meet it, and the card goes in. Sealed, it goes through the slot.
    const T = 3650
    const SLOW = 1.3
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
        { transform: 'rotate(0deg) skewX(0deg)', offset: 0, easing: EASE },
        { transform: 'rotate(-2.4deg) skewX(1.2deg)', offset: o(320), easing: EASE },
        { transform: 'rotate(0.9deg) skewX(-0.5deg)', offset: o(560), easing: EASE },
        { transform: 'rotate(0deg) skewX(0deg)', offset: o(720) },
        { transform: 'rotate(0deg) skewX(0deg)', offset: o(800), easing: EASE },
        { transform: 'rotate(1.8deg) skewX(-1deg)', offset: o(980), easing: EASE },
        { transform: 'rotate(-0.6deg) skewX(0.3deg)', offset: o(1120), easing: EASE },
        { transform: 'rotate(0deg) skewX(0deg)', offset: o(1250) },
        { transform: 'rotate(0deg) skewX(0deg)', offset: o(1600), easing: EASE },
        { transform: 'rotate(-0.8deg) skewX(0.6deg)', offset: o(1780), easing: EASE },
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
    // Sealed, it tips a little, then slides down into the slot (everything below the slot is cut off).
    g.style.transformOrigin = `${ex + (ew * sc) / 2}px ${ey + (eh * sc) / 2}px`
    const dropY = slotY + eh * sc + pad * sc + 20 - ey
    const post = g.animate(
      [
        { transform: 'none', offset: 0 },
        { transform: 'none', offset: o(2350), easing: EASE_OUT },
        { transform: 'translateY(-14px) rotate(-1.5deg)', offset: o(2600), easing: EASE_IN },
        { transform: `translateY(${dropY}px) rotate(0deg)`, offset: o(3200) },
        { transform: `translateY(${dropY}px) rotate(0deg)`, offset: 1 },
      ],
      opts,
    )
    const cutAt = window.setTimeout(() => (c.style.height = `${slotY}px`), o(2600) * T * SLOW)
    // The slot: a 0.9px grey line cut into the page, which opens up and down (its two edges part,
    // white between), takes the envelope, and closes the same way.
    const px = (n: number) => `${n}px`
    const edge = (dir: 1 | -1) => [
      { transform: 'translateY(0)', visibility: 'hidden', offset: 0 },
      { transform: 'translateY(0)', visibility: 'hidden', offset: o(2149) },
      { transform: 'translateY(0)', visibility: 'visible', offset: o(2150), easing: EASE },
      { transform: `translateY(${dir * 5}px)`, visibility: 'visible', offset: o(2420) },
      { transform: `translateY(${dir * 5}px)`, visibility: 'visible', offset: o(3200), easing: EASE },
      { transform: 'translateY(0)', visibility: 'visible', offset: o(3420) },
      { transform: 'translateY(0)', visibility: 'visible', offset: o(3550) },
      { transform: 'translateY(0)', visibility: 'hidden', offset: o(3551) },
      { transform: 'translateY(0)', visibility: 'hidden', offset: 1 },
    ]
    const [top, bottom] = [...st.children] as HTMLElement[]
    const slotAnim = top.animate(edge(-1), opts)
    const slotAnim2 = bottom.animate(edge(1), opts)
    // As it goes in, the slot's shadow falls on the part of the envelope just above it (it is
    // going somewhere deep): drawn each frame from where the envelope really is.
    const sh = shade.current
    let raf = 0
    const follow = () => {
      const env = back.current?.getBoundingClientRect()
      if (sh && env) {
        const inSlot = env.bottom > slotY && env.top < slotY
        const top = Math.max(env.top, slotY - 30)
        Object.assign(sh.style, { left: px(env.left), width: px(env.width), top: px(top), height: px(Math.max(0, slotY - top)), opacity: inSlot ? '1' : '0' })
      }
      raf = requestAnimationFrame(follow)
    }
    raf = requestAnimationFrame(follow)
    slotAnim.onfinish = () => done.current()
    return () => {
      clearTimeout(cutAt)
      cancelAnimationFrame(raf)
      ;[card, sway, light, flapClose, post, slotAnim, slotAnim2, ...parts].forEach((a) => a?.cancel())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      <div ref={clip} className="absolute inset-x-0 top-0 h-full overflow-hidden">
        {/* The envelope and the card in it move as one once it is sealed. */}
        <div ref={group} className="absolute inset-0">
          <Envelope division={division} back={back} pocket={pocket} flap={flap} />
          <div ref={box} className="absolute left-0 top-0 z-[2] origin-top-left" style={{ transform: 'translateY(200vh)' }}>
            {front}
          </div>
        </div>
        {/* The slot's shadow on the envelope as it goes in (above it, cut with it at the slot). */}
        <div ref={shade} className="absolute" style={{ opacity: 0, backgroundImage: 'linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.08) 45%, rgb(0 0 0 / 0.38))' }} />
      </div>
      {/* The slot: two 0.9px grey edges, one on the other (a line) until they part. */}
      <div ref={slot} className="absolute left-1/2 h-0 -translate-x-1/2" style={{ width: 0 }}>
        <span className="invisible absolute inset-x-0 top-0 h-[0.9px] bg-[#a9a6a0]" />
        <span className="invisible absolute inset-x-0 top-0 h-[0.9px] bg-[#a9a6a0]" />
      </div>
    </div>
  )
}
