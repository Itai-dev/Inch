'use client'

/**
 * A chapter's pictures as small black-and-white prints on a pile. As the pile scrolls up the
 * screen they land one after another: each appears at once (a jump cut, no fade) and falls
 * the last few pixels onto the pile. Scrolling back up lifts them off again.
 */
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export type Pic = { src: string; alt: string; credit?: string }

/** Where each print lands: offset (share of its own size) and angle. */
const PILE = [
  { x: -92, y: -62, r: -4 },
  { x: -12, y: -52, r: 3 },
  { x: -52, y: -34, r: -1.5 },
]
/** Where the pile's top must be (share of the viewport height) for each print to land. */
const LAND_AT = [0.82, 0.64, 0.46]

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
        const top = el.getBoundingClientRect().top / innerHeight
        setLanded(LAND_AT.filter((at) => top < at).length)
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
    <div ref={ref} className={`relative h-[clamp(340px,36vw,540px)] ${className}`}>
      {pics.slice(0, PILE.length).map((pic, k) => {
        const { x, y } = PILE[k]
        const r = flip ? -PILE[k].r : PILE[k].r
        const down = k < landed
        return (
          <figure
            key={k}
            className="absolute left-1/2 top-1/2 w-[clamp(150px,15vw,240px)] bg-white p-[5%] pb-[13%] motion-reduce:transition-none"
            style={{
              zIndex: k,
              // Jump cut in, then a quick fall (accelerating, like gravity). Out: gone at once.
              opacity: down ? 1 : 0,
              transform: down
                ? `translate(${x}%, ${y}%) rotate(${r}deg)`
                : `translate(${x}%, ${y - 9}%) rotate(${r * 2.5}deg) scale(1.07)`,
              boxShadow: down
                ? '0 1px 2px rgb(0 0 0 / 0.08), 8px 14px 28px -10px rgb(0 0 0 / 0.35)'
                : '0 1px 2px rgb(0 0 0 / 0.04), 18px 34px 50px -14px rgb(0 0 0 / 0.22)',
              transition: down ? 'transform 0.26s cubic-bezier(0.55, 0, 0.9, 0.4), box-shadow 0.26s cubic-bezier(0.55, 0, 0.9, 0.4)' : 'none',
            }}
          >
            <span className="relative block aspect-[4/5] overflow-hidden bg-line">
              <Image src={pic.src} alt={pic.alt} fill sizes="240px" unoptimized={pic.src.endsWith('.svg')} className="object-cover grayscale contrast-[1.08]" />
            </span>
            {pic.credit && <figcaption className="absolute bottom-[3%] left-[5%] text-[9px] uppercase tracking-wide text-[#6f6f6f]">{pic.credit}</figcaption>}
          </figure>
        )
      })}
    </div>
  )
}
