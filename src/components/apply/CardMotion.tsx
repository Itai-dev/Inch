'use client'

/**
 * The comp card's two moments in the application.
 * - CardOpening: the page opens on the card lying face down in the middle, the form's title on
 *   its back; it turns over, then moves to its place beside the form (on phones, into the card
 *   strip above it), and hands over to the real card there.
 * - CardPost: once the application is sent, the card comes to the middle of the screen and drops
 *   through a slot, like a letter into a letterbox; the slot closes after it.
 * Both draw a copy of the card over the page (fixed), so the page under it can lay itself out.
 */
import { useEffect, useLayoutEffect, useRef } from 'react'
import { Logo } from '@/components/brand/Logo'
import { TypeText } from '@/components/motion/TypeText'
import type { Division } from '@/sanity/lib/types'

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
/** Where the card goes or comes from: the card itself beside the form (`card`), or the strip it folds into on phones. */
export type Place = { el: HTMLElement; card: boolean } | null
/** The card's width over the page: the real card's, else a phone's comfortable width. */
const cardWidth = (r: DOMRect | null, card: boolean) => (r && card ? r.width : Math.min(innerWidth * 0.86, 380))

export function CardOpening({
  front,
  title,
  division,
  target,
  onDone,
}: {
  front: React.ReactNode
  title: string
  division: Division
  /** Where the card ends up: the aside (desktop) or the folded strip (phones). */
  target: () => Place
  onDone: () => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const flip = useRef<HTMLDivElement>(null)
  const done = useRef(onDone)
  useLayoutEffect(() => {
    done.current = onDone
  })

  // After the page's own refs are set (the card's place is measured from them).
  useEffect(() => {
    const el = box.current
    const fl = flip.current
    const t = target()
    if (!el || !fl) return
    const r = t?.el.getBoundingClientRect() ?? null
    const desk = !!t?.card
    const w = cardWidth(r, desk)
    el.style.width = `${w}px`
    const h = el.offsetHeight
    // Face down in the middle (a little high), turned over there, then to its place.
    const cx = (innerWidth - w) / 2
    const cy = Math.max(70, (innerHeight - h) / 2 - innerHeight * 0.03)
    const tx = r ? r.left : cx
    const ty = r ? r.top : cy
    const s = r && !desk ? r.width / w : 1
    // The place moves the whole card (from its corner); the turn is about its own middle.
    const at = (x: number, y: number, scale = 1) => `translate(${x}px, ${y}px) scale(${scale})`
    const opts = { duration: 2700, fill: 'forwards' as const }
    const a = el.animate(
      [
        { transform: at(cx, cy + 40), opacity: 0, offset: 0 },
        { transform: at(cx, cy), opacity: 1, offset: 0.08, easing: 'linear' },
        { transform: at(cx, cy), opacity: 1, offset: 0.6, easing: EASE },
        { transform: at(tx, ty, s), opacity: desk ? 1 : 0, offset: 1 },
      ],
      opts,
    )
    const b = fl.animate(
      [
        { transform: 'perspective(1600px) rotateY(180deg)', offset: 0 },
        { transform: 'perspective(1600px) rotateY(180deg)', offset: 0.36, easing: EASE },
        { transform: 'perspective(1600px) rotateY(0deg)', offset: 0.6 },
        { transform: 'perspective(1600px) rotateY(0deg)', offset: 1 },
      ],
      opts,
    )
    a.onfinish = () => done.current()
    return () => {
      a.cancel()
      b.cancel()
    }
    // Plays once, from where the page is when it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={box} aria-hidden className="pointer-events-none fixed left-0 top-0 z-30 origin-top-left" style={{ opacity: 0 }}>
      <div ref={flip} className="relative [transform-style:preserve-3d]">
      <div className="[backface-visibility:hidden]">{front}</div>
      {/* Its back: the form's title, typing in while it lies face down. */}
      <div
        className="absolute inset-0 flex flex-col justify-between border border-[#bcbcbc] bg-[#f9f9f9] p-[clamp(22px,2.6vw,40px)] text-[#0a0a0a] shadow-[-8px_30px_20px_-24px_rgb(0_0_0/0.32),0_2px_8px_rgb(0_0_0/0.06)] [backface-visibility:hidden]"
        style={{ transform: 'rotateY(180deg)' }}
      >
        <Logo division={division} className="text-[28px]" />
        <p className="wordmark text-[clamp(44px,5vw,76px)] uppercase leading-[0.95]">
          <TypeText text={title} at={250} ms={45} />
        </p>
        <span className="label text-[11px] text-[#6f6f6f]">Application</span>
      </div>
      </div>
    </div>
  )
}

export function CardPost({ front, from, onDone }: { front: React.ReactNode; from: () => Place; onDone: () => void }) {
  const clip = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const slot = useRef<HTMLDivElement>(null)
  const done = useRef(onDone)
  useLayoutEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    const el = box.current
    const c = clip.current
    const sl = slot.current
    if (!el || !c || !sl) return
    const f = from()
    const r = f?.el.getBoundingClientRect() ?? null
    const desk = !!f?.card
    const w = cardWidth(r, desk)
    el.style.width = `${w}px`
    const h = el.offsetHeight
    // The slot sits low in the screen; everything above it shows, nothing below.
    const slotY = Math.round(innerHeight * 0.74)
    c.style.height = `${slotY}px`
    sl.style.top = `${slotY - 4}px`
    sl.style.width = `${w * 1.12}px`
    const cx = (innerWidth - w) / 2
    const cy = Math.max(70, slotY - h - innerHeight * 0.08)
    // From the card beside the form; on phones, up from below the screen.
    const sx = r && desk ? r.left : cx
    const sy = r && desk ? r.top : innerHeight
    const at = (x: number, y: number, turn = 0) => `translate(${x}px, ${y}px) rotate(${turn}deg)`
    const card = el.animate(
      [
        { transform: at(sx, sy), offset: 0, easing: EASE },
        { transform: at(cx, cy), offset: 0.38, easing: 'linear' },
        { transform: at(cx, cy), offset: 0.52, easing: 'cubic-bezier(0.55, 0, 0.9, 0.5)' },
        { transform: at(cx, slotY + 12), offset: 1 },
      ],
      { duration: 2100, fill: 'forwards' },
    )
    // The slot opens as the card gets there, and closes once it has gone through.
    const open = sl.animate([{ transform: 'translateX(-50%) scaleX(0)' }, { transform: 'translateX(-50%) scaleX(1)' }], { duration: 420, delay: 600, easing: EASE, fill: 'both' })
    let close: Animation | null = null
    card.onfinish = () => {
      close = sl.animate([{ transform: 'translateX(-50%) scaleX(1)' }, { transform: 'translateX(-50%) scaleX(0)' }], { duration: 380, easing: EASE, fill: 'forwards' })
      close.onfinish = () => done.current()
    }
    return () => {
      card.cancel()
      open.cancel()
      close?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      <div ref={clip} className="absolute inset-x-0 top-0 overflow-hidden">
        <div ref={box} className="absolute left-0 top-0" style={{ transform: 'translateY(200vh)' }}>
          {front}
        </div>
      </div>
      {/* The slot: a dark opening in the page, a little wider than the card. */}
      <div ref={slot} className="absolute left-1/2 h-2 rounded-full bg-fg shadow-[0_3px_10px_rgb(0_0_0/0.35)_inset,0_1px_0_rgb(255_255_255/0.6)]" style={{ transform: 'translateX(-50%) scaleX(0)' }} />
    </div>
  )
}
