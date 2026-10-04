'use client'

/**
 * DOT. — square-index carousel.
 * Counterpart to INCH”'s tape-measure strip: one image at a time, each change
 * is a hard ■ aperture wipe from the centre; the index is a row of squares
 * (active = filled) with a mono counter. Drag / wheel / arrow keys / click.
 */
import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import type { Slide } from './types'

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

export function DotIndexCarousel({ slides, height = '100dvh' }: { slides: Slide[]; height?: string }) {
  const N = slides.length
  const [i, setI] = useState(0)
  const [prevI, setPrevI] = useState<number | null>(null)
  const go = useCallback(
    (to: number) => {
      if (!N) return
      const n = ((to % N) + N) % N
      if (n === i) return
      setPrevI(i)
      setI(n)
    },
    [N, i],
  )
  const wheelLock = useRef(false)
  const dragX = useRef<number | null>(null)

  if (!N) return null
  const s = slides[i]
  const img = (src: string, alt: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} draggable={false} className="block size-full object-cover" />
  )

  return (
    <section
      className="flex w-full select-none flex-col gap-6 bg-bg px-5 py-10 md:flex-row md:items-end md:gap-12 md:px-10"
      style={{ minHeight: height }}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Talents"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(i + 1)
        if (e.key === 'ArrowLeft') go(i - 1)
      }}
      onWheel={(e) => {
        if (wheelLock.current || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 12) return
        wheelLock.current = true
        go(i + (e.deltaY > 0 || e.deltaX > 0 ? 1 : -1))
        setTimeout(() => (wheelLock.current = false), 380)
      }}
    >
      {/* Stage */}
      <div
        className="relative aspect-[3/4] w-full max-w-[min(560px,62dvh)] overflow-hidden bg-surface"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => (dragX.current = e.clientX)}
        onPointerUp={(e) => {
          if (dragX.current === null) return
          const d = e.clientX - dragX.current
          if (Math.abs(d) > 40) go(i + (d < 0 ? 1 : -1))
          dragX.current = null
        }}
      >
        {prevI !== null && <div className="absolute inset-0">{img(slides[prevI].src, '')}</div>}
        <div
          key={i}
          className="absolute inset-0"
          style={{ ['--dot' as string]: '10px', animation: prevI === null ? 'none' : 'dot-aperture 0.55s cubic-bezier(0.87, 0, 0.13, 1) both' }}
        >
          {s.href ? <Link href={s.href} className="block size-full">{img(s.src, s.alt)}</Link> : img(s.src, s.alt)}
        </div>
      </div>

      {/* Index */}
      <div className="flex flex-1 flex-col gap-6">
        <p className="font-bold leading-none" style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', fontStretch: '80%' }} aria-live="polite">
          {pad2(i + 1)}
          <span className="text-muted">/{pad2(N)}</span>
        </p>
        <p className="label">{s.caption || s.alt}</p>
        <ol className="flex flex-wrap gap-2.5">
          {slides.map((sl, k) => (
            <li key={sl.id}>
              <button
                onClick={() => go(k)}
                aria-label={`${pad2(k + 1)} — ${sl.alt}`}
                aria-current={k === i}
                className={`block size-3 border border-fg transition-transform duration-150 ${k === i ? 'scale-125 bg-fg' : 'bg-transparent hover:bg-fg/40'}`}
              />
            </li>
          ))}
        </ol>
        <div className="flex gap-6">
          <button onClick={() => go(i - 1)} className="label">← Prev</button>
          <button onClick={() => go(i + 1)} className="label">Next →</button>
        </div>
      </div>
    </section>
  )
}
