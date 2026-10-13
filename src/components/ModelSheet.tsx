'use client'

/**
 * Model page as a full-screen sheet (after monster-mgmt.com): no site header or footer,
 * just the model. Contrast toggle top-left, close top-right; stats on the left, the book
 * on the right with a 1 / N counter; name, books and actions along the bottom.
 * Instead of scrolling, the book is driven by the INCH” ruler from the home hero:
 * click a number, arrow keys, wheel, swipe or click either half of the image. Each new
 * image pushes the last one out sideways, as in the hero.
 *
 * Books switch in place (the URL follows with replaceState, so every book keeps its own
 * link without a page load). Close steps back to the page you came from, or the board.
 */
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Division, Measurements as M, TalentCard } from '@/sanity/lib/types'
import { measurementRows, type Unit } from './Measurements'
import { Ruler } from './motion/Ruler'
import type { Slide } from './motion/types'
import { hasSitePageBehind } from './RouteMemory'
import { useSelection } from './selection/SelectionProvider'

export type Book = { segment: string; title: string; slides: Slide[]; view: View }
type View = 'book' | 'thumbnails'

const PUSH_MS = 900
const PUSH_EASE = 'cubic-bezier(0.45, 0, 0.25, 1)' // the hero's soft ease in-out
const WHEEL_LOCK_MS = 650
const mod = (a: number, n: number) => ((a % n) + n) % n
const near = (i: number, k: number, n: number) => Math.min(mod(i - k, n), mod(k - i, n)) <= 2

const tabCls = (on: boolean) => `uppercase transition-colors ${on ? 'text-fg' : 'text-muted hover:text-fg'}`
const bold = { fontStretch: '80%' } as const

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
  const [dark, setDark] = useState(division === 'men')
  const [unit, setUnit] = useState<Unit>('cm')
  // idx is unbounded so the ruler always slides the short way round; `from` is the image being pushed out.
  const [nav, setNav] = useState({ idx: 0, from: 0 })
  const slides = book?.slides ?? []
  const N = slides.length
  const current = N ? mod(nav.idx, N) : 0
  const showBook = !!book && view === 'book' && N > 0

  const close = useCallback(() => {
    if (hasSitePageBehind()) router.back()
    else router.push(closeHref)
  }, [router, closeHref])

  const go = useCallback((k: number) => setNav((n) => (k === n.idx ? n : { idx: k, from: n.idx })), [])
  const step = useCallback((d: number) => N > 1 && setNav((n) => ({ idx: n.idx + d, from: n.idx })), [N])

  const open = (s: string) => {
    const b = books.find((x) => x.segment === s)
    setSegment(s)
    setView(b?.view ?? 'book')
    setNav({ idx: 0, from: 0 })
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

  // Push: the incoming image slides in from the side we're heading to, shoving the old one out.
  const els = useRef<(HTMLElement | null)[]>([])
  useLayoutEffect(() => {
    const { idx, from } = nav
    if (from === idx || reduced || !N) return
    const out = els.current[mod(from, N)]
    const inn = els.current[mod(idx, N)]
    if (!out || !inn || out === inn) return
    const dir = idx > from ? 1 : -1
    const opts = { duration: PUSH_MS, easing: PUSH_EASE }
    inn.animate([{ transform: `translateX(${dir * 100}%)` }, { transform: 'translateX(0)' }], opts)
    out.animate([{ transform: 'translateX(0)', visibility: 'visible' }, { transform: `translateX(${-dir * 100}%)`, visibility: 'visible' }], opts)
  }, [nav, N, reduced])

  // Wheel (desktop, where the sheet doesn't scroll) moves one image per flick.
  const wheelLock = useRef(false)
  const onWheel = (e: React.WheelEvent) => {
    if (window.innerWidth < 768 || wheelLock.current) return
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (Math.abs(d) < 12) return
    wheelLock.current = true
    step(d > 0 ? 1 : -1)
    setTimeout(() => (wheelLock.current = false), WHEEL_LOCK_MS)
  }
  // Swipe on touch screens.
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

  // Ruler: the hero's, scaled down a little.
  const [vw, setVw] = useState(1440)
  useEffect(() => {
    const on = () => setVw(window.innerWidth)
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const rs = Math.min(1, Math.max(0.6, vw / 1920)) * 0.8

  const { has, toggle } = useSelection()
  const selected = talent ? has(talent._id) : false
  const handle = instagram?.replace('@', '')
  const stats = measurements ? measurementRows(measurements, division, unit) : []
  const tabs = [...books.map((b) => ({ segment: b.segment, title: b.title })), ...(bio ? [{ segment: 'bio', title: 'Bio' }] : [])]

  const renderTabs = (className: string) => (
    <nav className={className} style={bold} aria-label="Books">
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
  )

  const renderActions = (className: string) => (
    <div className={className} style={bold}>
      {book && N > 0 && (
        <button type="button" onClick={() => setView(view === 'book' ? 'thumbnails' : 'book')} className="uppercase hover:opacity-60">
          {view === 'book' ? 'Thumbnails' : 'Book'}
        </button>
      )}
      {compCard && (
        <a href={compCard} className="uppercase hover:opacity-60">
          PDF
        </a>
      )}
      {talent && (
        <button type="button" onClick={() => toggle(talent)} aria-pressed={selected} className="uppercase hover:opacity-60">
          {selected ? '✓ Selected' : '+ Select'}
        </button>
      )}
    </div>
  )

  const renderStats = (className: string) =>
    stats.length ? (
      <div className={className}>
        <dl className="contents">
          {stats.map(([k, v]) => (
            <div key={k} className="text-[13px] uppercase md:text-[15px]">
              <dt className="inline font-bold" style={bold}>{k}</dt> <dd className="inline normal-case">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex w-full justify-center gap-3 text-[13px] italic md:text-[15px]" role="group" aria-label="Units">
          {(['in', 'cm'] as Unit[]).map((u) => (
            <button key={u} type="button" onClick={() => setUnit(u)} aria-pressed={unit === u} className={`font-bold ${unit === u ? 'text-fg' : 'text-muted hover:text-fg'}`}>
              {u}
            </button>
          ))}
        </div>
      </div>
    ) : null

  return (
    <div
      data-model-sheet
      data-theme={dark ? 'dot' : 'light'}
      role="dialog"
      aria-modal="true"
      aria-label={name}
      className="model-sheet fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg text-fg md:overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-gutter pb-2 pt-[clamp(16px,2vw,28px)]">
        <button type="button" onClick={() => setDark((d) => !d)} aria-label="Switch contrast" aria-pressed={dark} className="hover:opacity-60">
          <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
            <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M16 2.5a13.5 13.5 0 0 0 0 27z" fill="currentColor" />
          </svg>
        </button>
        <button type="button" onClick={close} aria-label="Close" className="hover:opacity-60">
          <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
            <path d="M3 3l18 18M21 3L3 21" stroke="currentColor" strokeWidth="3" />
          </svg>
        </button>
      </div>

      {/* Phones: name, books and stats sit above the images. */}
      <div className="flex flex-col items-center gap-4 px-gutter pb-6 pt-2 text-center md:hidden">
        <h1 className="wordmark text-[40px] uppercase">{name}</h1>
        {renderTabs('flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] font-bold')}
        {renderStats('flex flex-wrap justify-center gap-x-4 gap-y-1.5')}
        {renderActions('flex gap-5 text-[13px] font-bold')}
      </div>

      {/* Main: stats | book (or thumbnails / bio) | counter */}
      <div className="relative flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {view === 'thumbnails' && book ? (
          <ul className="grid auto-rows-max grid-cols-3 gap-1 overflow-y-auto px-gutter pb-6 md:col-span-2 md:mx-auto md:w-full md:max-w-[1040px] md:grid-cols-5">
            {slides.map((s, i) => (
              <li key={i}>
                <button type="button" onClick={() => { setNav({ idx: i, from: i }); setView('book') }} className="block w-full" aria-label={`Open ${s.alt}`}>
                  <span className="block aspect-[3/4] bg-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.src} alt="" loading="lazy" className="size-full object-cover transition-opacity hover:opacity-80" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <aside className="hidden items-center justify-center md:flex">
              {renderStats('flex flex-col items-center gap-3 text-center')}
            </aside>

            {showBook && (
              <section
                className="relative h-[75dvh] select-none overflow-hidden md:h-auto md:pr-[calc(var(--gutter)+56px)]"
                aria-roledescription="carousel"
                aria-label={book.title}
                onWheel={onWheel}
                onPointerDown={onDown}
                onPointerUp={onUp}
                onPointerCancel={() => (swipe.current.on = false)}
                style={{ touchAction: 'pan-y' }}
              >
                <div className="relative size-full overflow-hidden">
                  {slides.map((s, i) => {
                    const on = i === current
                    const keep = on || i === mod(nav.from, N) || near(i, current, N)
                    return (
                      <figure
                        key={i}
                        ref={(el) => {
                          els.current[i] = el
                        }}
                        aria-hidden={!on}
                        className="absolute inset-0 m-0 flex flex-col items-center justify-center gap-2 px-gutter py-2 md:px-0"
                        style={{ visibility: on ? 'visible' : 'hidden' }}
                      >
                        {keep && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.src} alt={on ? s.alt : ''} draggable={false} className="block min-h-0 max-w-full flex-1 object-contain" />
                        )}
                        <figcaption className="h-4 max-w-full truncate text-[10px] uppercase tracking-wide text-muted">{s.caption}</figcaption>
                      </figure>
                    )
                  })}
                </div>
                {/* Click either half to go back / on. */}
                <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize" onClick={() => !swipe.current.moved && step(-1)} />
                <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize" onClick={() => !swipe.current.moved && step(1)} />
              </section>
            )}

            {segment === 'bio' && bio && (
              <section className="flex items-center px-gutter py-10 md:pr-[calc(var(--gutter)+56px)]">
                <p className="max-w-xl whitespace-pre-line text-lg">{bio}</p>
              </section>
            )}

            {showBook && (
              <p className="pointer-events-none absolute right-[var(--gutter)] top-1/2 hidden -translate-y-1/2 flex-col items-center text-[15px] font-bold leading-tight tabular-nums md:flex" aria-live="polite">
                <span>{current + 1}</span>
                <span className="my-1 h-[2px] w-6 bg-fg" aria-hidden />
                <span>{N}</span>
              </p>
            )}
          </>
        )}
      </div>

      {/* The ruler: the book's control, as on the home hero. */}
      {showBook && N > 1 && (
        <div className="shrink-0 pb-1 pt-3 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:pt-4">
          <div className="md:col-start-2 md:pr-[calc(var(--gutter)+56px)]">
            <Ruler
              count={N}
              pos={nav.idx}
              active={[current]}
              onSelect={go}
              reduced={reduced}
              segW={Math.round(60 * rs)}
              fontPx={Math.max(11, Math.round(21 * rs))}
              tickH={Math.round(26 * rs)}
              minors={9}
              duration={PUSH_MS}
              easing={PUSH_EASE}
            />
          </div>
          <div className="sr-only">
            <button type="button" onClick={() => step(-1)}>Previous image</button>
            <button type="button" onClick={() => step(1)}>Next image</button>
          </div>
        </div>
      )}

      {/* Bottom bar: name | books | actions */}
      <div className="hidden shrink-0 grid-cols-[1fr_auto_1fr] items-end gap-8 px-gutter pb-[clamp(16px,2vw,28px)] pt-4 md:grid">
        <h1 className="wordmark max-w-[8ch] text-[clamp(28px,2.4vw,44px)] uppercase">{name}</h1>
        {renderTabs('flex gap-8 pb-1 text-[15px] font-bold')}
        {renderActions('flex justify-end gap-6 pb-1 text-[15px] font-bold')}
      </div>
    </div>
  )
}
