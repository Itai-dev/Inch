'use client'

/**
 * Model page as a full-screen sheet over the site (no header or footer): the book as a
 * magazine. A top rail carries the name, the stats in one line and close; one spread sits
 * in the middle with the neighbouring pages peeking in faded at the edges; books and
 * actions run along the bottom over the INCH” ruler from the home hero, which drives the
 * book (click a number, arrow keys, wheel, swipe or either half of the spread).
 * Phones get one page at a time.
 *
 * Books switch in place (the URL follows with replaceState, so every book keeps its own
 * link without a page load). Close steps back to the page you came from, or the board.
 */
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Division, Measurements as M, TalentCard } from '@/sanity/lib/types'
import { measurementRows, type Unit } from './Measurements'
import { Ruler } from './motion/Ruler'
import type { Slide } from './motion/types'
import { hasSitePageBehind } from './RouteMemory'
import { useSelection } from './selection/SelectionProvider'

export type Book = { segment: string; title: string; slides: Slide[]; view: View }
type View = 'book' | 'thumbnails'

const SLIDE_MS = 700
const EASE = 'cubic-bezier(0.45, 0, 0.25, 1)' // the hero's soft ease in-out
const FOLD = 2 // the gutter between the two pages of a spread
const GAP = 16 // between spreads
const CAPTION_H = 22
const WHEEL_LOCK_MS = 650
const OFFSETS = [-2, -1, 0, 1, 2] // spreads rendered around the current one (±2 sit off screen)

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const mod = (a: number, n: number) => ((a % n) + n) % n
const tabCls = (on: boolean) => `uppercase transition-colors ${on ? 'text-fg' : 'text-muted hover:text-fg'}`
const narrow = { fontStretch: '80%' } as const

export function ModelSheet({
  talent,
  name,
  division,
  measurements,
  bio,
  instagram,
  books,
  initial,
  base,
  compCard,
  closeHref,
}: {
  /** For the selection; null for placeholder models. */
  talent: TalentCard | null
  name: string
  division: Division
  measurements?: M
  bio?: string
  instagram?: string
  books: Book[]
  /** URL segment of the book (or 'bio') to open on. */
  initial: string
  /** Public path of the model page; books live at `${base}/${segment}`. */
  base: string
  compCard: string | null
  closeHref: string
}) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [segment, setSegment] = useState(initial)
  const book = books.find((b) => b.segment === segment)
  const [view, setView] = useState<View>(book?.view ?? 'book')
  const [unit, setUnit] = useState<Unit>('cm')
  const slides = book?.slides ?? []
  const N = slides.length
  const showBook = !!book && view === 'book' && N > 0

  // Stage size → pages per spread and page size.
  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ w: 1440, h: 680 })
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setStage({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [showBook])
  const per = stage.w < 640 ? 1 : 2
  const pages = Math.max(1, Math.ceil(N / per))
  const peek = per === 2 ? 80 : 12 // at least this much of the neighbours shows
  let pageH = Math.max(0, stage.h - CAPTION_H)
  let pageW = pageH * 0.75
  if (pageW * per + FOLD * (per - 1) > stage.w - peek * 2) {
    pageW = Math.max(0, (stage.w - peek * 2 - FOLD * (per - 1)) / per)
    pageH = pageW / 0.75
  }
  const spreadW = pageW * per + FOLD * (per - 1)
  const left = (stage.w - spreadW) / 2
  const top = Math.max(0, (stage.h - pageH - CAPTION_H) / 2)

  // First visible page, unbounded so wrapping keeps moving forward (and the ruler the short way round).
  const [first, setFirst] = useState(0)
  const page = Math.floor(first / per)
  const indices = (abs: number) => {
    const p = mod(abs, pages)
    return Array.from({ length: per }, (_, j) => p * per + j).filter((i) => i < N)
  }
  const visible = indices(page)

  const step = useCallback((d: number) => N > per && setFirst((f) => f - mod(f, per) + d * per), [N, per])
  // Ruler → spread: k is an unbounded page index; land on the spread that holds it.
  const select = (k: number) => setFirst((Math.floor(k / N) * pages + Math.floor(mod(k, N) / per)) * per)
  const rulerPos = Math.floor(page / pages) * N + mod(page, pages) * per + (visible.length - 1) / 2

  const close = useCallback(() => {
    if (hasSitePageBehind()) router.back()
    else router.push(closeHref)
  }, [router, closeHref])

  const open = (s: string) => {
    const b = books.find((x) => x.segment === s)
    setSegment(s)
    setView(b?.view ?? 'book')
    setFirst(0)
    window.history.replaceState(null, '', s ? `${base}/${s}` : base)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (!showBook) return
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, step, showBook])

  const wheelLock = useRef(false)
  const onWheel = (e: React.WheelEvent) => {
    if (wheelLock.current) return
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (Math.abs(d) < 12) return
    wheelLock.current = true
    step(d > 0 ? 1 : -1)
    setTimeout(() => (wheelLock.current = false), WHEEL_LOCK_MS)
  }
  const swipe = useRef({ x: 0, y: 0, on: false, moved: false })
  const onDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY, on: true, moved: false }
  }
  const onUp = (e: React.PointerEvent) => {
    if (!swipe.current.on) return
    swipe.current.on = false
    const dx = e.clientX - swipe.current.x
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - swipe.current.y)) {
      swipe.current.moved = true
      step(dx < 0 ? 1 : -1)
    }
  }

  const { has, toggle } = useSelection()
  const selected = talent ? has(talent._id) : false
  const handle = instagram?.replace('@', '')
  const stats = measurements ? measurementRows(measurements, division, unit) : []
  const tabs = [...books.map((b) => ({ segment: b.segment, title: b.title })), ...(bio ? [{ segment: 'bio', title: 'Bio' }] : [])]
  const small = stage.w < 640
  const anim = reduced ? 'none' : `transform ${SLIDE_MS}ms ${EASE}, opacity ${SLIDE_MS}ms ${EASE}`

  const renderStats = (className: string) =>
    stats.length ? (
      <div className={className}>
        <dl className="contents">
          {stats.map(([k, v]) => (
            <div key={k} className="uppercase">
              <dt className="inline font-bold" style={narrow}>{k}</dt> <dd className="inline normal-case">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex gap-2 font-bold italic" role="group" aria-label="Units">
          {(['cm', 'in'] as Unit[]).map((u) => (
            <button key={u} type="button" onClick={() => setUnit(u)} aria-pressed={unit === u} className={unit === u ? 'text-fg' : 'text-muted hover:text-fg'}>
              {u}
            </button>
          ))}
        </div>
      </div>
    ) : null

  return (
    <div
      data-model-sheet
      role="dialog"
      aria-modal="true"
      aria-label={name}
      className="model-sheet fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg text-fg"
    >
      {/* Top rail: name | stats in one line | close */}
      <header className="flex shrink-0 flex-col gap-3 px-gutter pb-3 pt-[clamp(16px,2vw,28px)] md:grid md:min-h-[92px] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-8 md:py-0">
        <div className="flex items-start justify-between gap-4">
          <h1 className="wordmark text-[clamp(32px,3vw,44px)] uppercase">{name}</h1>
          <button type="button" onClick={close} aria-label="Close" className="-m-2 p-2 hover:opacity-60 md:hidden">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
              <path d="M3 3l18 18M21 3L3 21" stroke="currentColor" strokeWidth="3" />
            </svg>
          </button>
        </div>
        {renderStats('flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] md:flex-nowrap md:gap-x-[22px] md:text-[13px]')}
        <div className="hidden justify-end md:flex">
          <button type="button" onClick={close} aria-label="Close" className="hover:opacity-60">
            <svg viewBox="0 0 24 24" className="size-[26px]" aria-hidden>
              <path d="M3 3l18 18M21 3L3 21" stroke="currentColor" strokeWidth="3" />
            </svg>
          </button>
        </div>
      </header>

      {/* The book: one spread centred, the neighbouring pages faded at the edges */}
      {showBook && (
        <section
          ref={stageRef}
          className="relative min-h-0 flex-1 select-none overflow-hidden"
          aria-roledescription="carousel"
          aria-label={book.title}
          onWheel={onWheel}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (swipe.current.on = false)}
          style={{ touchAction: 'pan-y' }}
        >
          {OFFSETS.map((o) => {
            const abs = page + o
            const idx = indices(abs)
            // A short last spread sits against the current one on the left, centred when current.
            const short = (per - idx.length) * (pageW + FOLD) * (o < 0 ? 1 : o === 0 ? 0.5 : 0)
            return (
              <div
                key={abs}
                aria-hidden={o !== 0}
                className="absolute flex"
                style={{
                  top,
                  left: left + short,
                  gap: FOLD,
                  transform: `translateX(${o * (spreadW + GAP)}px)`,
                  opacity: o === 0 ? 1 : 0.22,
                  transition: anim,
                }}
              >
                {idx.map((i) => {
                  const s = slides[i]
                  return (
                    <figure key={i} className="m-0 shrink-0" style={{ width: pageW }}>
                      <div className="overflow-hidden bg-line" style={{ width: pageW, height: pageH }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.src} alt={o === 0 ? s.alt : ''} draggable={false} className="block size-full object-cover" />
                      </div>
                      {o === 0 && s.caption && (
                        <figcaption className="truncate pt-1.5 text-[10px] uppercase leading-tight tracking-wide text-muted">{s.caption}</figcaption>
                      )}
                    </figure>
                  )
                })}
              </div>
            )
          })}
          {/* Either half of the spread: back / on. */}
          <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize" onClick={() => !swipe.current.moved && step(-1)} />
          <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize" onClick={() => !swipe.current.moved && step(1)} />
          <p className="sr-only" aria-live="polite">
            {visible.map((i) => `${pad2(i + 1)} ${slides[i].caption || slides[i].alt}`).join(', ')} of {pad2(N)}
          </p>
        </section>
      )}

      {view === 'thumbnails' && book && (
        <ul className="grid min-h-0 flex-1 auto-rows-max grid-cols-3 gap-1 overflow-y-auto px-gutter py-2 md:mx-auto md:w-full md:max-w-[1040px] md:grid-cols-5">
          {slides.map((s, i) => (
            <li key={i}>
              <button type="button" onClick={() => { setFirst(i); setView('book') }} className="block w-full" aria-label={`Open ${s.alt}`}>
                <span className="block aspect-[3/4] bg-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt="" loading="lazy" className="size-full object-cover transition-opacity hover:opacity-80" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {segment === 'bio' && bio && (
        <section className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-gutter py-10">
          <p className="max-w-xl whitespace-pre-line text-lg">{bio}</p>
        </section>
      )}

      {/* Books | counter | actions, then the ruler across the full width */}
      <div className="flex shrink-0 flex-col gap-2.5 pb-[clamp(14px,1.4vw,20px)] pt-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-gutter text-[13px] font-bold uppercase md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:text-[14px]" style={narrow}>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 md:gap-x-[26px]" aria-label="Books">
            {tabs.map((t) => (
              <button key={t.segment} type="button" onClick={() => open(t.segment)} aria-current={t.segment === segment ? 'page' : undefined} className={tabCls(t.segment === segment)}>
                {t.title}
              </button>
            ))}
            {handle && (
              <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer" className={tabCls(false)}>
                IG
              </a>
            )}
          </nav>
          <span className="hidden tabular-nums text-muted md:block">
            {showBook && `${visible.map((i) => pad2(i + 1)).join('–')} / ${pad2(N)}`}
          </span>
          <div className="flex gap-5 md:justify-end md:gap-[26px]">
            {book && N > 0 && (
              <button type="button" onClick={() => setView(view === 'book' ? 'thumbnails' : 'book')} className="uppercase hover:opacity-60">
                {view === 'book' ? 'Thumbnails' : 'Book'}
              </button>
            )}
            {compCard && (
              <a href={compCard} className="hover:opacity-60">
                Comp card
              </a>
            )}
            {talent && (
              <button type="button" onClick={() => toggle(talent)} aria-pressed={selected} className="uppercase hover:opacity-60">
                {selected ? '✓ Selection' : '+ Selection'}
              </button>
            )}
          </div>
        </div>

        {showBook && N > per && (
          <>
            <Ruler
              count={N}
              pos={rulerPos}
              active={visible}
              onSelect={select}
              reduced={reduced}
              segW={small ? 40 : 48}
              fontPx={small ? 13 : 14}
              tickH={small ? 16 : 18}
              minors={9}
              duration={SLIDE_MS}
              easing={EASE}
            />
            <div className="sr-only">
              <button type="button" onClick={() => step(-1)}>Previous</button>
              <button type="button" onClick={() => step(1)}>Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
