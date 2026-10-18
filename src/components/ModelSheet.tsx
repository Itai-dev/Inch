'use client'

/**
 * Model page as a full-screen sheet over the site (no header or footer): the book as a
 * magazine. A top rail carries the name, the stats in one line and close; one spread sits
 * in the middle (two portrait pages, or one horizontal image in the same frame) with the
 * nothing beside it (the neighbours only show while sliding); books and
 * actions run along the bottom over the INCH” ruler from the home hero, which drives the
 * book (click a number, arrow keys, wheel, swipe or either half of the spread).
 * Phones get one page at a time.
 *
 * Books switch in place (the URL follows with replaceState, so every book keeps its own
 * link without a page load). Close steps back to the page you came from, or the board.
 */
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Division, Measurements as M, TalentCard } from '@/sanity/lib/types'
import { measurementRows, UnitToggle, type Unit } from './Measurements'
import { QuoteMark } from './brand/Marks'
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
const CREDIT_GAP = 12 // between a page and its credit
const WHEEL_LOCK_MS = 650
const OFFSETS = [-2, -1, 0, 1, 2] // spreads rendered around the current one (±2 sit off screen)
const INTRO_AT = 0 // everything starts opening together, as soon as the sheet appears
const WRITE_MS_PER_CHAR = 28
const INTRO_MS = 1600 // by then every opening animation is done

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const mod = (a: number, n: number) => ((a % n) + n) % n
/** The page's address doesn't change under it while it's open (books use replaceState after the start). */
const noSubscribe = () => () => {}
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
  // The spreads only slide when you move through the book: not while the stage is first measured
  // or resized (else the neighbouring spreads walk across the frame as it settles on its size).
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    let t = 0
    const ro = new ResizeObserver(([e]) => {
      setSettled(false)
      setStage({ w: e.contentRect.width, h: e.contentRect.height })
      clearTimeout(t)
      t = window.setTimeout(() => setSettled(true), 120)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      clearTimeout(t)
    }
  }, [showBook])
  const per = stage.w < 640 ? 1 : 2
  // Spreads: two portrait pages side by side, or one horizontal image filling the same frame.
  // A portrait with no portrait partner (before a horizontal one, or last) sits alone. Phones: one image each.
  const spreads: number[][] = []
  for (let i = 0; i < N; ) {
    const pair = per === 2 && !slides[i].landscape && i + 1 < N && !slides[i + 1].landscape
    spreads.push(pair ? [i, i + 1] : [i])
    i += pair ? 2 : 1
  }
  const S = Math.max(1, spreads.length)
  // Two-page spreads carry their credits up the outer edges (room for them each side); phones, below.
  const capH = per === 2 ? 0 : CAPTION_H
  const peek = per === 2 ? 44 : 12 // minimum breathing room each side of the frame
  let pageH = Math.max(0, stage.h - capH)
  let pageW = pageH * 0.75
  if (pageW * per + FOLD * (per - 1) > stage.w - peek * 2) {
    pageW = Math.max(0, (stage.w - peek * 2 - FOLD * (per - 1)) / per)
    pageH = pageW / 0.75
  }
  // Every spread takes the same frame, so the margins never change.
  const frameW = pageW * per + FOLD * (per - 1)
  const left = (stage.w - frameW) / 2
  const top = Math.max(0, (stage.h - pageH - capH) / 2)

  // Current spread, unbounded so wrapping keeps moving forward (and the ruler the short way round).
  const [cur, setCur] = useState(0)
  const spreadAt = (abs: number) => spreads[mod(abs, S)] ?? []
  const spreadOf = (i: number) => Math.max(0, spreads.findIndex((sp) => sp.includes(i)))
  const visible = spreadAt(cur)

  const step = useCallback((d: number) => S > 1 && setCur((c) => c + d), [S])
  // Ruler → spread: k is an unbounded image index; land on the spread that holds it.
  const select = (k: number) => setCur(Math.floor(k / N) * S + spreadOf(mod(k, N)))

  // Opened at a picture (?p=3, from the home page's selected work): sit on its spread while the
  // stage is still sizing itself (so nothing slides), then let go.
  const startParam = useSyncExternalStore(noSubscribe, () => Number(new URLSearchParams(location.search).get('p')) || 0, () => 0)
  const [startDone, setStartDone] = useState(false)
  const startSpread = !startDone && startParam > 0 && startParam <= N ? spreadOf(startParam - 1) : null
  if (startSpread !== null && cur !== startSpread) setCur(startSpread)
  if (startSpread !== null && settled) setStartDone(true)
  const rulerPos = Math.floor(cur / S) * N + ((visible[0] ?? 0) + (visible[visible.length - 1] ?? 0)) / 2

  const close = useCallback(() => {
    if (hasSitePageBehind()) router.back()
    else router.push(closeHref)
  }, [router, closeHref])

  const open = (s: string) => {
    const b = books.find((x) => x.segment === s)
    setSegment(s)
    setView(b?.view ?? 'book')
    setCur(0)
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
  // Both units, so each value keeps the width of the wider one and nothing moves when switching.
  const statsIn = measurements ? measurementRows(measurements, division, 'in') : []
  const statsCm = measurements ? measurementRows(measurements, division, 'cm') : []
  const stats = unit === 'in' ? statsIn : statsCm
  // The bio in parts, a sentence each (an inch on the ruler a sentence).
  const bioParts = useMemo(
    () =>
      (bio ?? '')
        .split(/\n\s*\n/)
        .flatMap((para) => para.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) ?? [])
        .map((x) => x.trim())
        .filter(Boolean),
    [bio],
  )
  const bioRef = useRef<HTMLElement>(null)
  const [bioAt, setBioAt] = useState(0)
  // The part nearest the middle of the view is the current one.
  const onBioScroll = () => {
    const el = bioRef.current
    if (!el) return
    const mid = el.getBoundingClientRect().top + el.clientHeight / 2
    let best = 0
    let d = Infinity
    el.querySelectorAll<HTMLElement>('[data-part]').forEach((p, i) => {
      const r = p.getBoundingClientRect()
      const x = Math.abs(r.top + r.height / 2 - mid)
      if (x < d) [d, best] = [x, i]
    })
    if (best !== bioAt) setBioAt(best)
  }
  const toBioPart = (i: number) => {
    const part = bioRef.current?.querySelectorAll<HTMLElement>('[data-part]')[i]
    part?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
  }

  const tabs = [...books.map((b) => ({ segment: b.segment, title: b.title })), ...(bio ? [{ segment: 'bio', title: 'Bio' }] : [])]
  const small = stage.w < 640
  const anim = reduced || !settled ? 'none' : `transform ${SLIDE_MS}ms ${EASE}`

  // Opening, all at once (first open only, data-intro): the name opens (NameOpen), every
  // other line writes itself in letter by letter, and the spread slides into its frame as one.
  const [intro, setIntro] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setIntro(false), INTRO_MS)
    return () => clearTimeout(id)
  }, [])
  const at = (ms: number) => ({ '--d': `${ms}ms` }) as React.CSSProperties
  // One step per letter, at the same pace for every line.
  const write = (text: string) => ({ ...at(INTRO_AT), '--n': text.length, '--t': `${text.length * WRITE_MS_PER_CHAR}ms` }) as React.CSSProperties

  const renderStats = (className: string) =>
    stats.length ? (
      <div className={className}>
        <dl className="contents">
          {stats.map(([k, v], i) => (
            <div key={k} className="intro-write uppercase" style={write(`${k} ${v}`)}>
              <dt className="inline" style={narrow}>{k}</dt>{' '}
              <dd className="inline-grid font-bold normal-case">
                {[statsIn[i][1], statsCm[i][1]].map((x, j) => (
                  <span key={j} aria-hidden={x !== v || undefined} className={`[grid-area:1/1] ${x === v ? '' : 'invisible'}`}>
                    {x}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <div className="intro-write" style={write('CM IN')}>
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
      </div>
    ) : null

  return (
    <div
      data-model-sheet
      data-intro={intro ? '' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={name}
      className="model-sheet fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg text-fg"
    >
      {/* Top rail: name | stats in one line | close */}
      <header className="flex shrink-0 flex-col gap-3 px-gutter pb-3 pt-[clamp(16px,2vw,28px)] md:grid md:min-h-[92px] md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8 md:py-0">
        <div className="flex items-start justify-between gap-4">
          {/* The brand's symbol, then the name (not set between the marks). */}
          <h1 aria-label={name} className="wordmark text-[clamp(32px,3vw,44px)] uppercase md:whitespace-nowrap">
            <span aria-hidden className="intro-fade relative mr-[0.24em] inline-block align-baseline" style={{ ...at(INTRO_AT), ...(division === 'men' ? { width: '0.3em', height: '0.3em' } : { width: '0.37em', height: '0.7em' }) }}>
              {division === 'men' ? (
                <span className="absolute inset-0 bg-current" />
              ) : (
                // Hangs from the top of the capitals, as in the logo.
                <QuoteMark className="absolute left-0 top-0 h-[0.42em] w-auto" />
              )}
            </span>
            <span aria-hidden className="intro-write inline-block" style={write(name)}>{name}</span>
          </h1>
          <button type="button" onClick={close} aria-label="Close" className="-m-2 p-2 hover:opacity-60 md:hidden">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
              <path d="M3 3l18 18M21 3L3 21" stroke="currentColor" strokeWidth="3" />
            </svg>
          </button>
        </div>
        {renderStats('flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] md:flex-nowrap md:justify-center md:gap-x-[clamp(14px,1.5vw,24px)] md:text-[15px]')}
        <div className="hidden items-center justify-end gap-6 md:flex">
          <button type="button" onClick={close} aria-label="Close" className="hover:opacity-60">
            <svg viewBox="0 0 24 24" className="size-[26px]" aria-hidden>
              <path d="M3 3l18 18M21 3L3 21" stroke="currentColor" strokeWidth="3" />
            </svg>
          </button>
        </div>
      </header>

      {/* The book: one spread centred, nothing beside it */}
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
          {/* The frame clips its own track: the neighbouring spreads only show while sliding in or out. */}
          <div className="intro-crop absolute overflow-hidden" style={{ top, left, width: frameW, height: pageH + capH, ...at(INTRO_AT) }}>
          {OFFSETS.map((o) => {
            const abs = cur + o
            const idx = spreadAt(abs)
            // A horizontal image fills the whole frame (on phones it fits inside the page).
            const wide = per === 2 && idx.length === 1 && !!slides[idx[0]]?.landscape
            const w = wide ? frameW : pageW
            return (
              <div
                key={abs}
                aria-hidden={o !== 0}
                data-current={o === 0 ? '' : undefined}
                className="absolute flex justify-center"
                style={{
                  left: 0,
                  width: frameW,
                  gap: FOLD,
                  transform: `translateX(${o * (frameW + GAP)}px)`,
                  transition: anim,
                }}
              >
                {idx.map((i) => {
                  const s = slides[i]
                  return (
                    <figure key={i} className="m-0 shrink-0" style={{ width: w }}>
                      <div className="overflow-hidden bg-line" style={{ width: w, height: pageH }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.src} alt={o === 0 ? s.alt : ''} draggable={false} className={`block size-full ${s.landscape && !wide ? 'object-contain' : 'object-cover'}`} />
                      </div>
                      {o === 0 && per === 1 && s.caption && (
                        <figcaption className="truncate pt-1.5 text-[10px] uppercase leading-tight tracking-[0.2em] text-muted">{s.caption}</figcaption>
                      )}
                    </figure>
                  )
                })}
              </div>
            )
          })}
          </div>
          {/* The credits, set vertically: up the left edge of the left page, down the right edge of the right one. */}
          {per === 2 &&
            visible.map((i, j) => {
              const caption = slides[i]?.caption
              if (!caption) return null
              const onLeft = visible.length === 2 && j === 0
              const w = visible.length === 1 && slides[i].landscape ? frameW : pageW
              const x = onLeft ? left - CREDIT_GAP : left + (visible.length === 2 ? frameW : (frameW + w) / 2) + CREDIT_GAP
              return (
                <p
                  key={`${cur}-${i}`}
                  className="credit-in pointer-events-none absolute truncate text-[10px] uppercase leading-none tracking-[0.2em] text-muted [writing-mode:vertical-rl]"
                  style={{ top, height: pageH, left: x, transform: onLeft ? 'translateX(-100%) rotate(180deg)' : undefined }}
                >
                  {caption}
                </p>
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
        <ul style={at(INTRO_AT)} className="intro-crop grid min-h-0 flex-1 auto-rows-max grid-cols-3 gap-1 overflow-y-auto px-gutter py-2 md:mx-auto md:w-full md:max-w-[1040px] md:grid-cols-5">
          {slides.map((s, i) => (
            <li key={i}>
              <button type="button" onClick={() => { setCur(spreadOf(i)); setView('book') }} className="block w-full" aria-label={`Open ${s.alt}`}>
                <span className="block aspect-[3/4] overflow-hidden bg-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt="" loading="lazy" className="size-full object-cover transition-opacity hover:opacity-80" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* The bio scrolls a part at a time, on the same ruler as the book: the part in the middle is
          at full strength and lights its inch; a click on the ruler scrolls to that part. */}
      {segment === 'bio' && bio && (
        <section ref={bioRef} onScroll={onBioScroll} style={at(INTRO_AT)} className="intro-fade min-h-0 flex-1 overflow-y-auto px-gutter [scrollbar-width:none]">
          <div className="mx-auto flex max-w-[38ch] flex-col gap-[clamp(28px,4vh,48px)] py-[30vh]">
            {bioParts.map((part, i) => (
              <p
                key={i}
                data-part
                className="whitespace-pre-line text-[clamp(20px,1.9vw,30px)] leading-[1.35] tracking-[-0.01em] transition-opacity duration-500"
                style={{ opacity: i === bioAt ? 1 : 0.22 }}
              >
                {part}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Books | counter | actions, then the ruler across the full width */}
      <div className="flex shrink-0 flex-col gap-2.5 pb-[clamp(14px,1.4vw,20px)] pt-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-gutter text-[15px] font-bold uppercase md:text-[16px]" style={narrow}>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 md:gap-x-[26px]" aria-label="Books">
            {tabs.map((t) => (
              <button key={t.segment} type="button" onClick={() => open(t.segment)} aria-current={t.segment === segment ? 'page' : undefined} className={`intro-write ${tabCls(t.segment === segment)}`} style={write(t.title)}>
                {t.title}
              </button>
            ))}
            {handle && (
              <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer" className={`intro-write ${tabCls(false)}`} style={write('IG')}>
                IG
              </a>
            )}
          </nav>
          <div className="flex gap-5 md:justify-end md:gap-[26px]">
            {book && N > 0 && (
              <button type="button" onClick={() => setView(view === 'book' ? 'thumbnails' : 'book')} className="intro-write uppercase hover:opacity-60" style={write('Thumbnails')}>
                {view === 'book' ? 'Thumbnails' : 'Book'}
              </button>
            )}
            {compCard && (
              <a href={compCard} className="intro-write hover:opacity-60" style={write('Comp card')}>
                Comp card
              </a>
            )}
            {talent && (
              <button type="button" onClick={() => toggle(talent)} aria-pressed={selected} className="intro-write uppercase hover:opacity-60" style={write('+ Selection')}>
                {selected ? 'Selected' : '+ Selection'}
              </button>
            )}
          </div>
        </div>

        {segment === 'bio' && bioParts.length > 1 && (
          <div className="intro-fade" style={at(INTRO_AT + 200)}>
            <Ruler
              count={bioParts.length}
              pos={bioAt}
              active={[bioAt]}
              onSelect={(k) => toBioPart(mod(k, bioParts.length))}
              reduced={reduced}
              segW={small ? 40 : 48}
              fontPx={small ? 13 : 14}
              tickH={small ? 16 : 18}
              minors={9}
              duration={SLIDE_MS}
              easing={EASE}
            />
          </div>
        )}

        {showBook && S > 1 && (
          <>
            <div className="intro-fade" style={at(INTRO_AT + 200)}>
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
            </div>
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
