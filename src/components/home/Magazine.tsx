'use client'

/**
 * A chapter told as a magazine, full screen: an open book on the floor, the chapter on the
 * first left page, a model on every right page and her name on the page facing it. Scrolling
 * turns the pages. The section is as tall as the book has spreads; the book stays put while
 * it is read. With reduced motion the pages change without turning.
 */
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import type { Pic } from './PrintPile'

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

/** The fold: pages darken a little toward the spine. */
const fold = (side: 'left' | 'right') =>
  `linear-gradient(to ${side === 'left' ? 'left' : 'right'}, rgb(0 0 0 / 0.14), rgb(0 0 0 / 0.03) 7%, transparent 16%)`

export function Magazine({ number, heading, text, brand, spreads }: { number: number; heading: string; text: string; brand: string; spreads: Spread[] }) {
  const section = useRef<HTMLElement>(null)
  const leaves = useRef<(HTMLDivElement | null)[]>([])
  const turns = Math.max(0, spreads.length - 1)

  useEffect(() => {
    const el = section.current
    if (!el || !turns) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const turn = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        // A short rest on the first and the last spread.
        const read = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)))
        const at = Math.min(1, Math.max(0, (read - 0.06) / 0.88)) * turns
        leaves.current.forEach((leaf, k) => {
          if (!leaf) return
          // Each turn takes the middle of its stretch, so every spread rests a moment.
          let p = Math.min(1, Math.max(0, (at - k - 0.15) / 0.7))
          if (reduce) p = Math.round(p)
          const e = smooth(p)
          leaf.style.transform = `rotateY(${(-180 * e).toFixed(2)}deg)`
          // Turned pages pile on the left, the latest on top; the rest wait on the right, the next on top.
          leaf.style.zIndex = String(e > 0.5 ? 20 + k : 20 - k)
          leaf.style.setProperty('--shade', (Math.sin(Math.PI * e) * 0.55).toFixed(3))
        })
      })
    }
    turn()
    addEventListener('scroll', turn, { passive: true })
    addEventListener('resize', turn)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', turn)
      removeEventListener('resize', turn)
    }
  }, [turns])

  if (!spreads.length) return null
  return (
    <section ref={section} aria-label={`${pad(number)} ${heading}`} className="relative" style={{ height: `${(turns + 1) * 90 + 10}dvh` }}>
      <div className="sticky top-0 flex h-[100dvh] items-center justify-center overflow-hidden bg-[#e7e6e3]">
        <div className="relative" style={{ width: 'min(92vw, 104dvh)', aspectRatio: '3 / 2', perspective: '2600px' }}>
          {/* The book's shadow on the floor. */}
          <span aria-hidden className="absolute inset-[2%_1%_-2%] bg-black/25 blur-2xl" />

          {/* First left page: the chapter. */}
          <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden bg-[#fbfbfa]">
            <div className="flex h-full flex-col p-[9%] text-[#0a0a0a]">
              <p className="text-[clamp(7px,0.75vw,11px)] uppercase tracking-[0.2em] text-[#6f6f6f]">{brand} — {pad(number)}</p>
              <h3 className="wordmark mt-auto text-[clamp(26px,4.2vw,68px)] uppercase leading-[0.85]">{heading}</h3>
              <p className="mt-[6%] max-w-[34ch] text-[clamp(9px,1.05vw,15px)] leading-snug">{text}</p>
            </div>
            <Folio n={2} side="left" />
            <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: fold('left') }} />
          </div>

          {/* Last right page: the last model, under all the leaves. */}
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
            <PhotoPage pic={spreads[spreads.length - 1].pic} />
            <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: fold('right') }} />
          </div>

          {/* The leaves: a model on the front, the next model's name on the back. */}
          {spreads.slice(0, turns).map((s, k) => (
            <div
              key={k}
              ref={(n) => {
                leaves.current[k] = n
              }}
              className="absolute inset-y-0 right-0 w-1/2 origin-left will-change-transform [transform-style:preserve-3d]"
              style={{ zIndex: 20 - k }}
            >
              <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden]">
                <PhotoPage pic={s.pic} />
                <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: fold('right') }} />
                <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" style={{ opacity: 'var(--shade, 0)' }} />
              </div>
              <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <NamePage name={spreads[k + 1].name} n={4 + k * 2} />
                <span aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: fold('left') }} />
                <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" style={{ opacity: 'var(--shade, 0)' }} />
              </div>
            </div>
          ))}

          {/* The spine. */}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-50 w-px -translate-x-1/2 bg-black/20" />
        </div>
      </div>
    </section>
  )
}
