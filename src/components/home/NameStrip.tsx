'use client'

/**
 * The board's names running past in giant type, every other one in outline, along the INCH”
 * ruler: each name on her numbered stretch of it. Each name opens her page; hovering one (with a
 * mouse) flicks quickly through her pictures beside the pointer and lights her stretch.
 */
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { rulerTicks, SEG_OVERLAP } from '@/lib/ruler'

export type StripName = { name: string; href: string; pics: string[] }

/** How long each picture shows while a name is hovered. */
const FLICK_MS = 170
/** Roughly how far apart the short ticks are; each stretch is divided evenly. */
const PITCH = 10

/** An inch of the ruler `w` px wide: short ticks about every PITCH px, an odd count so one lands mid-inch. */
function ticks(w?: number) {
  if (!w) return rulerTicks(12, 9)
  const n = Math.max(1, Math.round(w / PITCH) - 1)
  return rulerTicks(12, n % 2 ? n : n + 1, w)
}

export function NameStrip({ names, mark }: { names: StripName[]; mark: React.ReactNode }) {
  const [active, setActive] = useState<number | null>(null)
  const [flick, setFlick] = useState(0)
  const preview = useRef<HTMLDivElement>(null)
  const first = useRef<HTMLUListElement>(null)
  // Each name's stretch, measured, so its ticks divide it evenly and land on both ends.
  const [widths, setWidths] = useState<number[]>([])
  useLayoutEffect(() => {
    const ul = first.current
    if (!ul) return
    const measure = () => setWidths([...ul.children].map((li) => li.getBoundingClientRect().width))
    const ro = new ResizeObserver(measure)
    ro.observe(ul)
    return () => ro.disconnect()
  }, [])

  // Flick through the hovered model's pictures.
  const count = active === null ? 0 : names[active]?.pics.length ?? 0
  useEffect(() => {
    if (count < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setFlick((f) => f + 1), FLICK_MS)
    return () => clearInterval(id)
  }, [active, count])

  const follow = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !preview.current) return
    const { offsetWidth: w, offsetHeight: h } = preview.current
    // Beside the pointer, flipped to its left near the right edge, kept on screen vertically.
    const x = e.clientX + 24 + w > innerWidth ? e.clientX - 24 - w : e.clientX + 24
    const y = Math.min(innerHeight - h - 12, Math.max(12, e.clientY - h / 2))
    preview.current.style.transform = `translate(${x}px, ${y}px)`
  }

  const row = (copy: number) => (
    <ul ref={copy ? undefined : first} aria-hidden={copy > 0 || undefined} className="flex shrink-0 items-end">
      {names.map((n, i) => (
        <li key={n.href} className="ruler-cell flex flex-col">
          <span className="flex items-center gap-[0.3em] pr-[0.3em]">
            <Link
              href={n.href}
              tabIndex={copy > 0 ? -1 : undefined}
              onPointerEnter={(e) => {
                if (e.pointerType !== 'mouse') return
                follow(e)
                setFlick(0)
                setActive(i)
              }}
              onPointerLeave={() => setActive(null)}
              className={`wordmark whitespace-nowrap uppercase ${i % 2 ? 'marquee-outline hover:[-webkit-text-stroke-width:0] hover:text-fg' : 'hover:opacity-60'}`}
            >
              {n.name}
            </Link>
            {mark}
          </span>
          {/* Her stretch of the ruler, reaching to the next name. */}
          <span aria-hidden className="ruler-seg relative mt-[clamp(8px,0.9vw,14px)] block h-[24px]" style={{ width: `calc(100% + ${SEG_OVERLAP})` }}>
            <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[10px] font-extrabold tabular-nums leading-none">{String(i + 1).padStart(2, '0')}</span>
            <span className="ruler-draw absolute inset-x-0 bottom-0 block h-3" style={ticks(widths[i])} />
          </span>
        </li>
      ))}
    </ul>
  )

  const pics = active === null ? [] : names[active]?.pics ?? []
  const shown = pics.length ? flick % pics.length : 0
  return (
    <>
      <div onPointerMove={follow} className="ruler-board marquee-track flex w-max text-[clamp(56px,9vw,160px)] leading-none">
        {row(0)}
        {row(1)}
      </div>
      <div
        ref={preview}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-50 aspect-[4/5] w-[clamp(160px,14vw,260px)] overflow-hidden bg-line shadow-[0_18px_40px_-16px_rgb(0_0_0/0.45)] ${pics.length ? '' : 'invisible'}`}
      >
        {/* All of her pictures load together; one shows at a time (a hard cut, no fade). */}
        {pics.map((src, k) => (
          <Image key={src} src={src} alt="" fill sizes="260px" unoptimized={src.endsWith('.svg')} className={`object-cover grayscale ${k === shown ? '' : 'invisible'}`} />
        ))}
      </div>
    </>
  )
}
