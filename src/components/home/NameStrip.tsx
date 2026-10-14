'use client'

/**
 * The board's names running past in giant type, every other one in outline. Each name opens
 * her page; hovering one (with a mouse) shows her picture beside the pointer, cut in at once.
 */
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'

export type StripName = { name: string; href: string; src?: string }

export function NameStrip({ names, mark }: { names: StripName[]; mark: React.ReactNode }) {
  const [active, setActive] = useState<number | null>(null)
  const preview = useRef<HTMLDivElement>(null)

  const follow = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !preview.current) return
    const { offsetWidth: w, offsetHeight: h } = preview.current
    // Beside the pointer, flipped to its left near the right edge, kept on screen vertically.
    const x = e.clientX + 24 + w > innerWidth ? e.clientX - 24 - w : e.clientX + 24
    const y = Math.min(innerHeight - h - 12, Math.max(12, e.clientY - h / 2))
    preview.current.style.transform = `translate(${x}px, ${y}px)`
  }

  const row = (copy: number) => (
    <ul aria-hidden={copy > 0 || undefined} className="flex shrink-0 items-center">
      {names.map((n, i) => (
        <li key={n.href} className="flex items-center gap-[0.3em] pr-[0.3em]">
          <Link
            href={n.href}
            tabIndex={copy > 0 ? -1 : undefined}
            onPointerEnter={(e) => {
              if (e.pointerType !== 'mouse') return
              follow(e)
              setActive(i)
            }}
            onPointerLeave={() => setActive(null)}
            className={`wordmark whitespace-nowrap uppercase ${i % 2 ? 'marquee-outline hover:[-webkit-text-stroke-width:0] hover:text-fg' : 'hover:opacity-60'}`}
          >
            {n.name}
          </Link>
          {mark}
        </li>
      ))}
    </ul>
  )

  const pic = active === null ? undefined : names[active]?.src
  return (
    <>
      <div onPointerMove={follow} className="marquee-track flex w-max text-[clamp(56px,9vw,160px)] leading-none">
        {row(0)}
        {row(1)}
      </div>
      <div
        ref={preview}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-50 aspect-[4/5] w-[clamp(160px,14vw,260px)] overflow-hidden bg-line shadow-[0_18px_40px_-16px_rgb(0_0_0/0.45)] ${pic ? '' : 'invisible'}`}
      >
        {pic && <Image key={pic} src={pic} alt="" fill sizes="260px" unoptimized={pic.endsWith('.svg')} className="object-cover grayscale" />}
      </div>
    </>
  )
}
