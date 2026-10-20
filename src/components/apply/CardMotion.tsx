'use client'

/**
 * The application card's two moments, on heavy letterpress paper (brand reference: a sleeve with
 * a thumb cut, the mark blind-debossed, a fine printed line).
 * - CardOpening: the page opens on the card in its sleeve, in the middle of the screen. The sleeve
 *   slides away and lets the card out; its printed face (the form's headline and details) turns
 *   over to the comp card, which goes to its place beside the form, or on phones shrinks into
 *   the strip above it.
 * - CardPost: once the application is sent, the card comes back to the middle, the sleeve rises
 *   around it, and the two drop through a slot that closes after them.
 * Both draw copies over the page (fixed), so the page under them lays itself out undisturbed.
 */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { DivisionMark } from '@/components/brand/Marks'
import { SITES, siteForDivision } from '@/lib/sites'
import type { Division } from '@/sanity/lib/types'

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
const EASE_OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)'
/** Where the card goes or comes from: the card itself beside the form (`card`), or the strip it folds into on phones. */
export type Place = { el: HTMLElement; card: boolean } | null
/** The card's width over the page: the real card's, else a phone's comfortable width. */
const cardWidth = (r: DOMRect | null, card: boolean) => (r && card ? r.width : Math.min(innerWidth * 0.86, 380))
/** The sleeve: a little wider than the card, its top edge a little under the card's, the thumb cut's radius. */
const SLEEVE_PAD = 12
const SLEEVE_DROP = 0.07
const NOTCH = 0.12

/** Ink pressed into the paper: dark, with the light catching the lower lip of the impression. */
const press = { textShadow: '0 1px 0 rgb(255 255 255 / 0.75)' } as const
/** Blind deboss: no ink, just the shape pushed into the paper. */
const blind = { filter: 'drop-shadow(0 1px 0 rgb(255 255 255 / 0.95)) drop-shadow(0 -1px 0 rgb(0 0 0 / 0.16))', color: '#d9d6cf' } as const

/** The card's printed face: the form's headline and a few details, as on a real form. */
function FormFace({ division }: { division: Division }) {
  const s = SITES[siteForDivision(division)]
  const narrow = { fontStretch: '80%' } as const
  return (
    <div className="paper absolute inset-0 flex flex-col p-[clamp(22px,2.6vw,40px)] text-[#141414] [backface-visibility:hidden]" style={{ transform: 'rotateY(180deg)' }}>
      {/* The plate's impression, a hairline inside the edge. */}
      <span aria-hidden className="pointer-events-none absolute inset-[10px] shadow-[inset_0_1px_1px_rgb(0_0_0/0.07),inset_0_-1px_0_rgb(255_255_255/0.6)]" />
      {/* The mark alone at the top: what the sleeve's thumb cut shows. */}
      <span className="flex h-[17%] shrink-0 items-center justify-center" style={blind}>
        <DivisionMark division={division} size={34} />
      </span>
      <div className="mt-auto flex flex-col gap-4">
        <span className="text-[10px] uppercase tracking-[0.32em] text-[#55534f]" style={press}>{s.brand} Model Management</span>
        <p className="wordmark text-[clamp(40px,4.4vw,66px)] uppercase leading-[0.92]" style={press}>
          Model
          <br />
          Application
        </p>
        <span className="text-[11px] uppercase tracking-[0.22em] text-[#55534f]" style={{ ...press, ...narrow }}>
          The {s.label === 'Women' ? 'women’s' : 'men’s'} board · Tel Aviv · {new Date().getFullYear()}
        </span>
      </div>
      {/* The form's lines, printed, waiting to be filled in overleaf. */}
      <div className="mt-[7%] grid grid-cols-[auto_1fr] gap-x-3 gap-y-3.5 text-[10px] uppercase tracking-[0.18em] text-[#55534f]" style={press}>
        {['Name', 'Born', 'Height', 'Contact'].map((k) => (
          <span key={k} className="contents">
            <span>{k}</span>
            <span className="mb-[3px] self-end border-b border-[#141414]/35" />
          </span>
        ))}
      </div>
      <div className="mt-[7%] flex items-end justify-between text-[10px] uppercase tracking-[0.22em] text-[#55534f]" style={press}>
        <span>No. 0001</span>
        <span>Overleaf →</span>
      </div>
    </div>
  )
}

export function CardOpening({
  front,
  division,
  target,
  onDone,
}: {
  front: React.ReactNode
  division: Division
  /** Where the card ends up: the aside (desktop) or the folded strip (phones). */
  target: () => Place
  onDone: () => void
}) {
  const stage = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const flip = useRef<HTMLDivElement>(null)
  const sleeve = useRef<HTMLDivElement>(null)
  const done = useRef(onDone)
  useLayoutEffect(() => {
    done.current = onDone
  })

  // After the page's own refs are set (the card's place is measured from them).
  useEffect(() => {
    const el = box.current
    const fl = flip.current
    const sl = sleeve.current
    const t = target()
    if (!el || !fl || !sl) return
    const r = t?.el.getBoundingClientRect() ?? null
    const desk = !!t?.card
    const w = cardWidth(r, desk)
    el.style.width = `${w}px`
    const h = el.offsetHeight
    const sw = w + SLEEVE_PAD * 2
    const sh = h * (1 - SLEEVE_DROP) + SLEEVE_PAD
    sl.style.width = `${sw}px`
    sl.style.height = `${sh}px`
    // In the middle, a little high; the sleeve's top just under the card's, so the cut shows the mark.
    const cx = (innerWidth - w) / 2
    const cy = Math.max(70, (innerHeight - h) / 2 - innerHeight * 0.02)
    const sx = cx - SLEEVE_PAD
    const sy = cy + h * SLEEVE_DROP
    const tx = r ? r.left : cx
    const ty = r ? r.top : cy
    // Phones: the card shrinks to the strip's width and is cut to its height, so it becomes the strip.
    const k = r && !desk ? r.width / w : 1
    const keep = r && !desk ? r.height / k : h

    const T = 4600
    const o = (ms: number) => ms / T
    const at = (x: number, y: number, scale = 1) => `translate(${x}px, ${y}px) scale(${scale})`
    const card = el.animate(
      [
        { transform: at(cx, cy + 40), clipPath: 'inset(0 0 0 0)', offset: 0, easing: EASE_OUT },
        { transform: at(cx, cy), clipPath: 'inset(0 0 0 0)', offset: o(600) },
        // The card rises a touch as the sleeve leaves it.
        { transform: at(cx, cy), clipPath: 'inset(0 0 0 0)', offset: o(1200), easing: EASE },
        { transform: at(cx, cy - 18), clipPath: 'inset(0 0 0 0)', offset: o(2100), easing: EASE },
        { transform: at(cx, cy), clipPath: 'inset(0 0 0 0)', offset: o(3500), easing: EASE },
        { transform: at(tx, ty, k), clipPath: `inset(0 0 ${Math.max(0, h - keep)}px 0)`, offset: 1 },
      ],
      { duration: T, fill: 'forwards' },
    )
    const turn = fl.animate(
      [
        { transform: 'perspective(1800px) rotateY(180deg)', offset: 0 },
        { transform: 'perspective(1800px) rotateY(180deg)', offset: o(2600), easing: EASE },
        { transform: 'perspective(1800px) rotateY(0deg)', offset: o(3400) },
        { transform: 'perspective(1800px) rotateY(0deg)', offset: 1 },
      ],
      { duration: T, fill: 'forwards' },
    )
    const sleeveOut = sl.animate(
      [
        { transform: at(sx, sy + 40), offset: 0, easing: EASE_OUT },
        { transform: at(sx, sy), offset: o(600) },
        { transform: at(sx, sy), offset: o(1200), easing: 'cubic-bezier(0.5, 0, 0.75, 0)' },
        { transform: at(sx, innerHeight + 40), offset: o(2300) },
        { transform: at(sx, innerHeight + 40), offset: 1 },
      ],
      { duration: T, fill: 'forwards' },
    )
    // The sleeve and its card come in together, as one.
    const show = stage.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: EASE_OUT, fill: 'both' })
    // The light runs across the stock as it moves and as the card turns.
    const sheens = [...el.querySelectorAll<HTMLElement>('[data-sheen]'), ...sl.querySelectorAll<HTMLElement>('[data-sheen]')].map((s, i) =>
      s.animate([{ backgroundPosition: '160% 0' }, { backgroundPosition: '-60% 0' }], { duration: 1400, delay: i ? 400 : 2500, easing: EASE, fill: 'both' }),
    )
    card.onfinish = () => done.current()
    return () => {
      ;[card, turn, sleeveOut, show, ...sheens].forEach((a) => a?.cancel())
    }
    // Plays once, from where the page is when it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={stage} aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden" style={{ opacity: 0 }}>
      <div ref={box} className="absolute left-0 top-0 origin-top-left">
        <div ref={flip} className="relative [transform-style:preserve-3d]">
          <div className="relative [backface-visibility:hidden]">
            {front}
            <span aria-hidden data-sheen className="paper-sheen pointer-events-none absolute inset-0" />
          </div>
          <FormFace division={division} />
        </div>
      </div>
      <div ref={sleeve} className="absolute left-0 top-0">
        <SleeveFill division={division} />
      </div>
    </div>
  )
}

/** The sleeve filling its box (its cut sized from the box's width through a container query unit). */
function SleeveFill({ division }: { division: Division }) {
  const s = SITES[siteForDivision(division)]
  // The cut's radius in container units, so it follows the width the animation gives the box.
  const cut = `radial-gradient(circle at 50% 0, transparent ${NOTCH * 100}cqw, #000 calc(${NOTCH * 100}cqw + 0.6px))`
  return (
    <div className="absolute inset-0 [container-type:size]">
      <div className="paper absolute inset-0 shadow-[0_30px_40px_-28px_rgb(0_0_0/0.45),0_2px_6px_rgb(0_0_0/0.08)]" style={{ maskImage: cut, WebkitMaskImage: cut }}>
        {/* The cut's edge, pressed: light on its lip, shade inside it. */}
        <span
          aria-hidden
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: `${NOTCH * 200}cqw`, height: `${NOTCH * 200}cqw`, boxShadow: '0 1px 0 rgb(255 255 255 / 0.9), 0 2px 4px rgb(0 0 0 / 0.18)' }}
        />
        <p className="absolute inset-x-0 top-[52%] text-center text-[clamp(13px,1.1vw,16px)] tracking-[0.02em] text-[#141414]" style={press}>
          By application <span className="italic">only.</span>
        </p>
        <p className="absolute inset-x-0 bottom-[9%] text-center text-[9px] uppercase tracking-[0.42em] text-[#141414]" style={press}>
          {s.brand} Model Management
        </p>
      </div>
      <span aria-hidden data-sheen className="paper-sheen pointer-events-none absolute inset-0" style={{ maskImage: cut, WebkitMaskImage: cut }} />
    </div>
  )
}

export function CardPost({ front, division, from, onDone }: { front: React.ReactNode; division: Division; from: () => Place; onDone: () => void }) {
  const clip = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const sleeve = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLDivElement>(null)
  const done = useRef(onDone)
  useLayoutEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    const el = box.current
    const c = clip.current
    const sl = sleeve.current
    const st = slot.current
    if (!el || !c || !sl || !st) return
    const f = from()
    const r = f?.el.getBoundingClientRect() ?? null
    const desk = !!f?.card
    const w = cardWidth(r, desk)
    el.style.width = `${w}px`
    const h = el.offsetHeight
    const sw = w + SLEEVE_PAD * 2
    const sh = h * (1 - SLEEVE_DROP) + SLEEVE_PAD
    sl.style.width = `${sw}px`
    sl.style.height = `${sh}px`
    // Middle of the screen; the slot just under where the sleeve's foot will be.
    const cx = (innerWidth - w) / 2
    const cy = Math.max(64, Math.min((innerHeight - h) / 2 - innerHeight * 0.04, innerHeight - h - 90))
    const sx = cx - SLEEVE_PAD
    const sy = cy + h * SLEEVE_DROP
    const slotY = Math.round(Math.min(innerHeight - 24, sy + sh + 36))
    st.style.top = `${slotY - 4}px`
    st.style.width = `${sw * 1.1}px`
    // From the card beside the form; on phones, up from below the screen.
    const fx = r && desk ? r.left : cx
    const fy = r && desk ? r.top : innerHeight + 20

    const T = 3600
    const o = (ms: number) => ms / T
    const at = (x: number, y: number) => `translate(${x}px, ${y}px)`
    const below = sh + 60
    const card = el.animate(
      [
        { transform: at(fx, fy), offset: 0, easing: EASE },
        { transform: at(cx, cy), offset: o(900) },
        { transform: at(cx, cy), offset: o(2100), easing: 'cubic-bezier(0.55, 0, 0.9, 0.5)' },
        { transform: at(cx, slotY + below - (sy - cy)), offset: o(3000) },
        { transform: at(cx, slotY + below - (sy - cy)), offset: 1 },
      ],
      { duration: T, fill: 'forwards' },
    )
    const wrap = sl.animate(
      [
        { transform: at(sx, innerHeight + 40), offset: 0 },
        { transform: at(sx, innerHeight + 40), offset: o(800), easing: EASE },
        { transform: at(sx, sy), offset: o(1700) },
        { transform: at(sx, sy), offset: o(2100), easing: 'cubic-bezier(0.55, 0, 0.9, 0.5)' },
        { transform: at(sx, slotY + below), offset: o(3000) },
        { transform: at(sx, slotY + below), offset: 1 },
      ],
      { duration: T, fill: 'forwards' },
    )
    // Only once the sleeve is round the card does the slot open and cut off what goes through it.
    const cutAt = window.setTimeout(() => (c.style.height = `${slotY}px`), o(1900) * T)
    const open = st.animate([{ transform: 'translateX(-50%) scaleX(0)' }, { transform: 'translateX(-50%) scaleX(1)' }], { duration: 420, delay: 1700, easing: EASE, fill: 'both' })
    const close = st.animate([{ transform: 'translateX(-50%) scaleX(1)' }, { transform: 'translateX(-50%) scaleX(0)' }], { duration: 380, delay: 3100, easing: EASE, fill: 'forwards' })
    const sheen = [...sl.querySelectorAll<HTMLElement>('[data-sheen]')].map((s) => s.animate([{ backgroundPosition: '160% 0' }, { backgroundPosition: '-60% 0' }], { duration: 1300, delay: 900, easing: EASE, fill: 'both' }))
    close.onfinish = () => done.current()
    return () => {
      clearTimeout(cutAt)
      ;[card, wrap, open, close, ...sheen].forEach((a) => a.cancel())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      <div ref={clip} className="absolute inset-x-0 top-0 h-full overflow-hidden">
        <div ref={box} className="absolute left-0 top-0" style={{ transform: 'translateY(200vh)' }}>
          {front}
        </div>
        <div ref={sleeve} className="absolute left-0 top-0" style={{ transform: 'translateY(200vh)' }}>
          <SleeveFill division={division} />
        </div>
      </div>
      {/* The slot: a dark opening in the page, a little wider than the sleeve. */}
      <div ref={slot} className="absolute left-1/2 h-2 rounded-full bg-[#0a0a0a] shadow-[0_3px_10px_rgb(0_0_0/0.35)_inset,0_1px_0_rgb(255_255_255/0.6)]" style={{ transform: 'translateX(-50%) scaleX(0)' }} />
    </div>
  )
}
