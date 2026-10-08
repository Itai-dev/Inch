'use client'

/**
 * INCH” — measuring-tape book viewer.
 * Two images at a time (one on phones), centred, nothing on the sides.
 * A small ruler numbered 01…N tracks and drives it. Drag / wheel / click /
 * arrow keys. Credits sit below each image.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Ruler } from './Ruler'
import type { Slide } from './types'

const GAP = 12
const CAPTION_H = 28
const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const DUR = '0.5s'

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const mod = (a: number, n: number) => ((a % n) + n) % n

export function TapeCarousel({ slides, height = '100dvh', start = 0 }: { slides: Slide[]; height?: string; start?: number }) {
  const N = slides.length
  const reduced = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ w: 1200, h: 800 })
  const per = stage.w < 640 ? 1 : 2
  const pages = Math.max(1, Math.ceil(N / per))
  // First visible slide (unbounded, so wrapping keeps sliding forward).
  const [first, setFirst] = useState(start)
  const page = Math.floor(first / per)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const go = useCallback((dPages: number) => setFirst((f) => f - mod(f, per) + dPages * per), [per])
  const prev = useCallback(() => go(-1), [go])
  const next = useCallback(() => go(1), [go])
  // Ruler → page: k is an unbounded slide index; land on the page that holds it, the short way round.
  const selectSlide = (k: number) => setFirst((Math.floor(k / N) * pages + Math.floor(mod(k, N) / per)) * per)

  // Image size: fit `per` 3:4 images (plus captions) in the stage.
  const imgH = Math.max(0, stage.h - CAPTION_H)
  const imgW = Math.round(Math.min(imgH * 0.75, (stage.w - GAP * (per - 1)) / per, 720))
  const spreadW = imgW * per + GAP * (per - 1)

  const wheelLock = useRef(false)
  const onWheel = (e: React.WheelEvent) => {
    if (wheelLock.current || Math.abs(e.deltaX) < 8) return
    wheelLock.current = true
    if (e.deltaX > 0) next()
    else prev()
    setTimeout(() => (wheelLock.current = false), 400)
  }

  const drag = useRef({ active: false, x: 0, moved: false })
  const onDown = (e: React.PointerEvent) => {
    drag.current = { active: true, x: e.clientX, moved: false }
  }
  const onUp = (e: React.PointerEvent) => {
    if (!drag.current.active) return
    drag.current.active = false
    const d = e.clientX - drag.current.x
    if (Math.abs(d) > 40) {
      drag.current.moved = true
      if (d < 0) next()
      else prev()
    }
  }

  const visible = useMemo(() => {
    const p = mod(page, pages)
    return Array.from({ length: per }, (_, j) => p * per + j).filter((i) => i < N)
  }, [page, pages, per, N])

  if (!N) return null
  const anim = reduced ? 'none' : `transform ${DUR} ${EASE}`
  // Unbounded, so wrapping from the last spread to the first keeps the tape moving forward.
  const rulerPos = Math.floor(page / pages) * N + mod(page, pages) * per + (visible.length - 1) / 2

  return (
    <section
      className="relative flex w-full select-none flex-col overflow-hidden bg-bg px-5 pb-6 pt-4 md:px-10"
      style={{ height }}
      onWheel={onWheel}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') next()
        if (e.key === 'ArrowLeft') prev()
      }}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Book"
    >
      <div ref={stageRef} className="relative min-h-0 flex-1" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (drag.current.active = false)} style={{ touchAction: 'pan-y' }}>
        <div className="absolute left-1/2 top-0 h-full -translate-x-1/2 overflow-hidden" style={{ width: spreadW }}>
          {[-1, 0, 1].map((offset) => {
            const abs = page + offset
            const p = mod(abs, pages)
            const idx = Array.from({ length: per }, (_, j) => p * per + j).filter((i) => i < N)
            return (
              <div
                key={abs}
                className="absolute inset-y-0 left-0 flex justify-center"
                style={{ width: spreadW, gap: GAP, transform: `translateX(${offset * (spreadW + GAP)}px)`, transition: anim }}
                aria-hidden={offset !== 0}
              >
                {idx.map((i) => {
                  const s = slides[i]
                  return (
                    <figure key={s.id} className="m-0 shrink-0" style={{ width: imgW }}>
                      <div className="aspect-[3/4] overflow-hidden bg-line" style={{ width: imgW }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.src} alt={offset === 0 ? s.alt : ''} draggable={false} className="block size-full object-cover" />
                      </div>
                      {s.caption && (
                        <figcaption className="mt-2 truncate text-[10px] uppercase leading-tight tracking-wide text-muted">{s.caption}</figcaption>
                      )}
                    </figure>
                  )
                })}
              </div>
            )
          })}
        </div>
        {/* Click zones: left half back, right half forward. */}
        <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize" onClick={() => !drag.current.moved && prev()} />
        <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize" onClick={() => !drag.current.moved && next()} />
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.map((i) => `${pad2(i + 1)} ${slides[i].caption || slides[i].alt}`).join(', ')} of {pad2(N)}
      </p>

      <div className="mt-4 shrink-0">
        <Ruler count={N} pos={rulerPos} active={visible} onSelect={selectSlide} reduced={reduced} className="text-fg" />
      </div>
      <div className="sr-only">
        <button onClick={prev}>Previous</button>
        <button onClick={next}>Next</button>
      </div>
    </section>
  )
}
