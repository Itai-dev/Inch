'use client'

/**
 * INCH” — measuring-tape carousel (from Figma Make prototype).
 * Infinite 3:4 strip; a ruler numbered 01…N drives it. Drag / wheel / click /
 * hold / arrow keys.
 */
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Slide } from './types'

const SEG_W = 90
const SEG_H = 45
const MINOR_COUNT = 9
const MINOR_H = SEG_H * 0.37
const MID_H = SEG_H * 0.55
const TICK_W = 3.25
const NUM_H = 90
const GAP = 24
const HALF = 4
const PAD = 60
const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const DUR = '0.5s'

const MASK = [
  'linear-gradient(to right, transparent, rgba(0,0,0,0.06) calc(50% - 163px), rgba(0,0,0,0.18) calc(50% - 63px), black calc(50% - 48px), black calc(50% + 48px), rgba(0,0,0,0.18) calc(50% + 63px), rgba(0,0,0,0.06) calc(50% + 163px), transparent)',
  'radial-gradient(ellipse 400px 100% at 50% 50%, rgba(0,0,0,0.45) 0%, transparent 100%)',
].join(', ')

function ticks(total: number): ReactNode[] {
  const out: ReactNode[] = []
  const sub = SEG_W / (MINOR_COUNT + 1)
  for (let s = 0; s <= total; s++) {
    const x = s * SEG_W
    out.push(<rect key={`M${s}`} x={x - TICK_W / 2} y={0} width={TICK_W} height={SEG_H} />)
    if (s < total)
      for (let m = 1; m <= MINOR_COUNT; m++) {
        const mid = m === Math.ceil(MINOR_COUNT / 2)
        const w = mid ? TICK_W * 0.85 : TICK_W * 0.65
        const h = mid ? MID_H : MINOR_H
        out.push(<rect key={`m${s}-${m}`} x={x + m * sub - w / 2} y={SEG_H - h} width={w} height={h} />)
      }
  }
  return out
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

export function TapeCarousel({ slides, height = '100dvh' }: { slides: Slide[]; height?: string }) {
  const N = slides.length
  const reduced = useReducedMotion()
  const [pos, setPos] = useState(0)
  const [dragging, setDragging] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const [imgW, setImgW] = useState(560)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setImgW(Math.round(Math.min(width * 0.62, height * 0.92 * 0.75, 810)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const segs = N + PAD * 2
  const tapeW = segs * SEG_W
  const shift = -pos * SEG_W - PAD * SEG_W
  const labels = useMemo(
    () => Array.from({ length: segs }, (_, s) => pad2((((s - PAD) % N) + N) % N + 1)),
    [segs, N],
  )
  const tape = useMemo(() => ticks(segs), [segs])

  const prev = useCallback(() => setPos((p) => p - 1), [])
  const next = useCallback(() => setPos((p) => p + 1), [])

  const wheelLock = useRef(false)
  const onWheel = (e: React.WheelEvent) => {
    if (wheelLock.current || Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.6 && Math.abs(e.deltaY) < 8) return
    wheelLock.current = true
    if (e.deltaY > 0 || e.deltaX > 0) next()
    else prev()
    setTimeout(() => (wheelLock.current = false), 90)
  }

  const drag = useRef({ active: false, x: 0, start: 0, moved: false })
  const hold = useRef<{ t?: ReturnType<typeof setTimeout>; i?: ReturnType<typeof setInterval> }>({})
  const clearHold = () => {
    clearTimeout(hold.current.t)
    clearInterval(hold.current.i)
  }
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { active: true, x: e.clientX, start: pos, moved: false }
    setDragging(true)
    const dir = e.clientX > window.innerWidth / 2 ? 1 : -1
    hold.current.t = setTimeout(() => (hold.current.i = setInterval(() => setPos((p) => p + dir), 160)), 300)
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    const d = e.clientX - drag.current.x
    if (Math.abs(d) > 6) {
      drag.current.moved = true
      clearHold()
      setPos(drag.current.start + Math.round(-d / SEG_W))
    }
  }
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    clearHold()
    setDragging(false)
    if (drag.current.active && !drag.current.moved) {
      const rect = e.currentTarget.getBoundingClientRect()
      const off = Math.floor((e.clientX - (rect.left + rect.width / 2) + SEG_W / 2) / SEG_W)
      setPos((p) => p + off)
    }
    drag.current.active = false
  }

  if (!N) return null
  const current = ((pos % N) + N) % N
  const anim = dragging || reduced ? 'none' : `transform ${DUR} ${EASE}`

  return (
    <section
      className="relative flex w-full select-none flex-col overflow-hidden bg-bg pb-6 pt-10"
      style={{ height }}
      onWheel={onWheel}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') next()
        if (e.key === 'ArrowLeft') prev()
      }}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Talents"
    >
      <div ref={stageRef} className="relative min-h-0 flex-1">
        {Array.from({ length: HALF * 2 + 1 }, (_, k) => {
          const offset = k - HALF
          const abs = pos + offset
          const s = slides[((abs % N) + N) % N]
          const dist = Math.abs(offset)
          const style: React.CSSProperties = {
            width: imgW,
            transform: `translate(calc(-50% + ${offset * (imgW + GAP)}px), -48%)`,
            transition: dragging || reduced ? 'none' : `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
            opacity: dist === 0 ? 1 : dist === 1 ? 0.18 : 0.06,
          }
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.src} alt={dist === 0 ? s.alt : ''} draggable={false} className="block size-full object-cover" />
          )
          return (
            <div key={abs} className="absolute left-1/2 top-1/2 aspect-[3/4] overflow-hidden" style={style} aria-hidden={dist !== 0}>
              {dist === 0 && s.href ? (
                <Link href={s.href} className="block size-full">{img}</Link>
              ) : (
                <button tabIndex={-1} className="block size-full cursor-pointer" onClick={() => setPos((p) => p + offset)}>{img}</button>
              )}
            </div>
          )
        })}
      </div>

      <p className="label mt-3 text-center" aria-live="polite">
        {slides[current].caption || slides[current].alt}
      </p>

      <div
        className="relative mt-2 w-full shrink-0 overflow-hidden"
        style={{ height: NUM_H + SEG_H + 4, touchAction: 'none', maskImage: MASK, WebkitMaskImage: MASK, cursor: dragging ? 'grabbing' : 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="absolute inset-y-0" style={{ left: `calc(50% - ${SEG_W / 2}px)` }}>
          <div className="pointer-events-none absolute left-0" style={{ bottom: SEG_H - 12, height: NUM_H, width: tapeW, transform: `translateX(${shift}px)`, transition: anim, willChange: 'transform' }}>
            {labels.map((l, s) => (
              <div key={s} className="absolute bottom-0 flex h-full items-end justify-center pb-1.5" style={{ left: s * SEG_W, width: SEG_W }}>
                <span className="text-[35px] font-bold leading-none text-fg">{l}</span>
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0" style={{ height: SEG_H, transform: `translateX(${shift}px)`, transition: anim, willChange: 'transform' }}>
            <svg width={tapeW} height={SEG_H} viewBox={`0 0 ${tapeW} ${SEG_H}`} className="block fill-current text-fg">{tape}</svg>
          </div>
        </div>
      </div>
      <div className="sr-only">
        <button onClick={prev}>Previous</button>
        <button onClick={next}>Next</button>
      </div>
    </section>
  )
}
