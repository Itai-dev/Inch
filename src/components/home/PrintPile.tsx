'use client'

/**
 * A chapter's pictures as small black-and-white prints on a pile, up to ten. As the pile scrolls
 * up the screen they land one after another: each appears at once (a jump cut, no fade) and
 * drops the last few pixels onto the pile, quickly. Scrolling back up lifts them off again.
 */
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export type Pic = { src: string; alt: string; credit?: string }

/** Where each print lands, around the pile's centre: offset (share of its own size) and angle. */
const PILE = [
  { x: -50, y: -50, r: -3 },
  { x: -118, y: -66, r: -6 },
  { x: 16, y: -38, r: 5 },
  { x: -84, y: -24, r: 2.5 },
  { x: -18, y: -76, r: -4.5 },
  { x: -150, y: -36, r: 7 },
  { x: 48, y: -70, r: -2 },
  { x: -64, y: -82, r: 4 },
  { x: -30, y: -28, r: -7 },
  { x: -54, y: -54, r: 1 },
]
/** Where the pile's centre must be (share of the viewport height) for each print to land: the first as it comes into view, the last a little above the middle. */
const LAND_AT = PILE.map((_, k) => 0.95 - (k * 0.5) / (PILE.length - 1))

export function PrintPile({ pics, flip = false, className = '' }: { pics: Pic[]; flip?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [landed, setLanded] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const check = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const mid = (r.top + r.height / 2) / innerHeight
        setLanded(LAND_AT.filter((at) => mid < at).length)
      })
    }
    check()
    addEventListener('scroll', check, { passive: true })
    addEventListener('resize', check)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', check)
      removeEventListener('resize', check)
    }
  }, [])

  return (
    <div ref={ref} className={`relative h-[clamp(420px,46vw,720px)] ${className}`}>
      {pics.slice(0, PILE.length).map((pic, k) => {
        // Flipped piles are mirrored around the centre.
        const x = flip ? -100 - PILE[k].x : PILE[k].x
        const y = PILE[k].y
        const r = flip ? -PILE[k].r : PILE[k].r
        const down = k < landed
        return (
          <figure
            key={k}
            className="absolute left-1/2 top-1/2 w-[clamp(120px,19vw,320px)] bg-white p-[1.4%] motion-reduce:transition-none"
            style={{
              zIndex: k,
              // Jump cut in, then a short, quick drop (accelerating, like gravity). Out: gone at once.
              opacity: down ? 1 : 0,
              transform: down
                ? `translate(${x}%, ${y}%) rotate(${r}deg)`
                : `translate(${x}%, ${y - 6}%) rotate(${r * 1.8}deg) scale(1.05)`,
              boxShadow: down
                ? '0 1px 2px rgb(0 0 0 / 0.08), 8px 14px 28px -10px rgb(0 0 0 / 0.35)'
                : '0 1px 2px rgb(0 0 0 / 0.04), 18px 34px 50px -14px rgb(0 0 0 / 0.22)',
              transition: down ? 'transform 0.14s cubic-bezier(0.55, 0, 0.9, 0.4), box-shadow 0.14s cubic-bezier(0.55, 0, 0.9, 0.4)' : 'none',
            }}
          >
            <span className="relative block aspect-[4/5] overflow-hidden bg-line">
              <Image src={pic.src} alt={pic.alt} fill sizes="(min-width: 768px) 20vw, 130px" unoptimized={pic.src.endsWith('.svg')} className="object-cover grayscale contrast-[1.08]" />
            </span>
            {pic.credit && <figcaption className="absolute left-0 top-full mt-1.5 text-[9px] uppercase tracking-wide text-[#6f6f6f]">{pic.credit}</figcaption>}
          </figure>
        )
      })}
    </div>
  )
}
