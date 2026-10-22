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
      <div ref={back} style={OFF} className="absolute left-0 top-0 z-[1] origin-top-left bg-[#dcd9d1] shadow-[0_34px_44px_-30px_rgb(0_0_0/0.5),0_2px_6px_rgb(0_0_0/0.08)]" />
      {/* In front of the card: the back of the envelope, its side and bottom folds meeting under the flap. */}
      <div ref={pocket} style={OFF} className="absolute left-0 top-0 z-[3] origin-top-left [filter:drop-shadow(0_-1px_1px_rgb(0_0_0/0.12))]">
        <div className="paper absolute inset-0" style={{ clipPath: POCKET }}>
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
          <div className="paper absolute inset-0" style={{ clipPath: FLAP }}>
            {/* Shaded towards its tip, so it reads as a sheet folded over. */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, rgb(0 0 0 / 0.05))' }} />
          </div>
          <span className="absolute bottom-[14%] left-1/2 -translate-x-1/2" style={blind}>
            <DivisionMark division={division} size={26} />
          </span>
        </div>
        <div className="absolute inset-0 bg-[#d6d2ca] [backface-visibility:hidden]" style={{ clipPath: FLAP, transform: 'rotateX(180deg)' }} />
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
/** The envelope's scale: whole on screen, with room above for the card to rise out of it. */
const envScale = (ew: number, eh: number) => Math.min(1, (innerWidth * 0.82) / ew, (innerHeight * 0.6) / eh)

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
    const clipTo = !toCard && r ? `inset(0 0 ${Math.max(0, h - r.height + 1)}px 0)` : 'inset(0 0 0 0)'

    // It grows in from small, unhurried, turning slightly as it comes; then, quicker, turns over and goes to its place.
    const T = 1900
    const o = (ms: number) => ms / T
    const opts = { duration: T, fill: 'forwards' as const }
    const card = el.animate(
      [
        { transform: place(fit * 0.55), clipPath: 'inset(0 0 0 0)', offset: 0, easing: EASE_OUT },
        { transform: place(fit), clipPath: 'inset(0 0 0 0)', offset: o(750) },
        { transform: place(fit), clipPath: 'inset(0 0 0 0)', offset: o(1300), easing: EASE },
        { transform: at(tx, ty, zoom), clipPath: clipTo, offset: 1 },
      ],
      opts,
    )
    const turn = fl.animate(
      [
        { transform: 'perspective(1800px) rotateZ(-7deg) rotateY(180deg)', offset: 0, easing: EASE_OUT },
        { transform: 'perspective(1800px) rotateZ(-1.5deg) rotateY(180deg)', offset: o(750), easing: EASE },
        { transform: 'perspective(1800px) rotateZ(0deg) rotateY(180deg)', offset: o(850), easing: EASE },
        { transform: 'perspective(1800px) rotateZ(0deg) rotateY(0deg)', offset: o(1250) },
        { transform: 'perspective(1800px) rotateZ(0deg) rotateY(0deg)', offset: 1 },
      ],
      opts,
    )
    const show = stage.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: EASE_OUT, fill: 'both' })
    card.onfinish = () => done.current()
    // Skipping: everything jumps to its end (which also finishes the card, and so calls onDone).
    if (skipRef) skipRef.current = () => [turn, show, card].forEach((a) => a?.finish())
    return () => {
      if (skipRef) skipRef.current = null
      ;[card, turn, show].forEach((a) => a?.cancel())
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
    const w = cardWidth(desk ? r : null, zoom)
    el.style.width = `${w}px`
    const h = el.offsetHeight
    const { pad, ew, eh, fh } = envSize(w, h)
    fit([back.current, pocket.current, flap.current], ew, eh, fh)

    // The open envelope low in the middle (smaller if need be); the card above it; the slot just under it.
    const sc = envScale(ew, eh)
    const ex = (innerWidth - ew * sc) / 2
    const ey = Math.min(innerHeight - eh * sc - 60, Math.max(80, (innerHeight - eh * sc) / 2 + h * sc * 0.2))
    const cx = ex + pad * sc
    const inY = ey + pad * sc
    const rise = Math.min(h * sc * 0.6, inY - 70)
    const slotY = Math.round(Math.min(innerHeight - 20, ey + eh * sc + 30))
    st.style.top = `${slotY - 4}px`
    st.style.width = `${ew * sc * 1.1}px`
    // From the card beside the form; on phones, up from below the screen.
    const fx = r && desk ? r.left : cx
    const fy = r && desk ? r.top : innerHeight + 20

    const T = 4700
    const o = (ms: number) => ms / T
    const opts = { duration: T, fill: 'forwards' as const }
    const below = eh * sc + 80
    const card = el.animate(
      [
        { transform: at(fx, fy, desk ? zoom : 1), offset: 0, easing: EASE },
        { transform: at(cx, inY - rise, sc), offset: o(900) },
        { transform: at(cx, inY - rise, sc), offset: o(1300), easing: EASE },
        { transform: at(cx, inY, sc), offset: o(2100) },
        { transform: at(cx, inY, sc), offset: 1 },
      ],
      opts,
    )
    const env = [
      { transform: at(ex, innerHeight + 60, sc), offset: 0, easing: EASE },
      { transform: at(ex, ey, sc), offset: o(1100) },
      { transform: at(ex, ey, sc), offset: 1 },
    ]
    const parts = [back.current, pocket.current].map((p) => p?.animate(env, opts))
    // Open while the card goes in; it closes over it.
    const flapClose = flap.current?.animate(
      [
        { transform: flapAt(ex, innerHeight + 60 + fh * sc, 180, ew, sc), zIndex: 1, offset: 0, easing: EASE },
        { transform: flapAt(ex, ey, 180, ew, sc), zIndex: 1, offset: o(1100) },
        { transform: flapAt(ex, ey, 180, ew, sc), zIndex: 1, offset: o(2150), easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
        { transform: flapAt(ex, ey, 90, ew, sc), zIndex: 1, offset: o(2450) },
        { transform: flapAt(ex, ey, 90, ew, sc), zIndex: 4, offset: o(2451), easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)' },
        { transform: flapAt(ex, ey, 0, ew, sc), zIndex: 4, offset: o(2750) },
        { transform: flapAt(ex, ey, 0, ew, sc), zIndex: 4, offset: 1 },
      ],
      opts,
    )
    // Sealed, the whole envelope is picked up: a little to the side and up, turned slightly, as in a
    // hand; then posted, lower corner first, through the slot (everything below the slot is cut off).
    g.style.transformOrigin = `${ex + (ew * sc) / 2}px ${ey + (eh * sc) / 2}px`
    const dropY = slotY + below + pad - ey
    const post = g.animate(
      [
        { transform: 'none', offset: 0 },
        { transform: 'none', offset: o(2850), easing: EASE_OUT },
        { transform: 'translate(46px, -54px) rotate(-5deg)', offset: o(3350) },
        { transform: 'translate(46px, -54px) rotate(-5deg)', offset: o(3480), easing: EASE_IN },
        { transform: `translate(8px, ${dropY}px) rotate(-2deg)`, offset: o(4300) },
        { transform: `translate(8px, ${dropY}px) rotate(-2deg)`, offset: 1 },
      ],
      opts,
    )
    const cutAt = window.setTimeout(() => (c.style.height = `${slotY}px`), o(3450) * T)
    const open = st.animate([{ transform: 'translateX(-50%) scaleX(0)' }, { transform: 'translateX(-50%) scaleX(1)' }], { duration: 420, delay: 2950, easing: EASE, fill: 'both' })
    const close = st.animate([{ transform: 'translateX(-50%) scaleX(1)' }, { transform: 'translateX(-50%) scaleX(0)' }], { duration: 380, delay: 4320, easing: EASE, fill: 'forwards' })
    close.onfinish = () => done.current()
    return () => {
      clearTimeout(cutAt)
      ;[card, flapClose, post, open, close, ...parts].forEach((a) => a?.cancel())
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
      </div>
      {/* The slot: a thin dark cut in the page, a little wider than the envelope. */}
      <div ref={slot} className="absolute left-1/2 h-[3px] bg-[#0a0a0a]" style={{ transform: 'translateX(-50%) scaleX(0)' }} />
    </div>
  )
}
