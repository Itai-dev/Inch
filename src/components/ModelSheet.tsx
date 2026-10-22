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
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { Division, Measurements as M, TalentCard } from '@/sanity/lib/types'
import { measurementRows, UnitToggle, type Unit } from './Measurements'
import { Logo } from './brand/Logo'
import { Ruler } from './motion/Ruler'
import { TypeText } from './motion/TypeText'
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
const ROW_H = 46 // the books and actions under a two-page spread, with the gap above them
const SIDE_W = 215 // on wide screens, the room kept each side of the spread for the sizes and the actions
const WHEEL_LOCK_MS = 650
const OFFSETS = [-2, -1, 0, 1, 2] // spreads rendered around the current one (±2 sit off screen)
const INTRO_AT = 0 // everything starts opening together, as soon as the sheet appears
const WRITE_MS_PER_CHAR = 28
const INTRO_MS = 1600 // by then every opening animation is done
const THUMB_GAP = 6
/** The name's capitals as tall as the logo: Archivo's cap height is 0.69em, the logo is drawn 0.72em tall. */
const NAME_PER_LOGO = 0.72 / 0.69

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const mod = (a: number, n: number) => ((a % n) + n) % n
/** The page's address doesn't change under it while it's open (books use replaceState after the start). */
const noSubscribe = () => () => {}
/** Wide screens: the name alone on top, the sizes down the left, books and actions down the right. */
const WIDE = '(min-width: 1024px)'
const onWide = (cb: () => void) => {
  const m = matchMedia(WIDE)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
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
  enquiry,
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
  /** A booking enquiry for this model, as an email. */
  enquiry?: string | null
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
  // Two pages: the books and actions sit just under the spread, so leave room for them.
  // Wide screens: the sizes and the books and actions stand either side of the spread; else they run under it.
  const wide = useSyncExternalStore(onWide, () => matchMedia(WIDE).matches, () => false)
  const beside = wide && showBook && per === 2
  const underSpread = showBook && per === 2 && !wide
  const rowH = underSpread ? ROW_H : 0
  const peek = per === 2 ? (wide ? SIDE_W : 44) : 12 // minimum room each side of the frame
  // Wide screens keep the pictures a little short of the full height, so the name has the room.
  let pageH = Math.max(0, stage.h - capH - rowH) * (wide ? 0.95 : 1)
  let pageW = pageH * 0.75
  if (pageW * per + FOLD * (per - 1) > stage.w - peek * 2) {
    pageW = Math.max(0, (stage.w - peek * 2 - FOLD * (per - 1)) / per)
    pageH = pageW / 0.75
  }
  // Every spread takes the same frame, so the margins never change.
  const frameW = pageW * per + FOLD * (per - 1)
  const left = (stage.w - frameW) / 2
  // Wide: the pictures start right under the name, the same gap below it as above it.
  const top = wide ? 0 : Math.max(0, (stage.h - pageH - capH - rowH) / 2)

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

  const tabs = [...books.map((b) => ({ segment: b.segment, title: b.title })), ...(bio ? [{ segment: 'bio', title: 'Bio' }] : [])]
  const small = stage.w < 640
  const anim = reduced || !settled ? 'none' : `transform ${SLIDE_MS}ms ${EASE}`

  // Thumbnails: as large as they can be and still all on screen (the columns chosen for the largest
  // cells), centred in the stage; phones get three across and scroll.
  const thumbPad = wide ? SIDE_W + 16 : 20
  const thumbW = Math.max(0, stage.w - thumbPad * 2)
  const thumbH = Math.max(0, stage.h - 32)
  let thumbCols = 3
  let thumbSize = (thumbW - THUMB_GAP * 2) / 3
  if (per === 2) {
    thumbSize = 0
    for (let c = 2; c <= 6; c++) {
      const rows = Math.ceil(N / c)
      const s = Math.min((thumbW - THUMB_GAP * (c - 1)) / c, ((thumbH - THUMB_GAP * (rows - 1)) / rows) * 0.75)
      if (s > thumbSize) [thumbSize, thumbCols] = [s, c]
    }
  }
  thumbSize = Math.max(100, Math.floor(thumbSize))

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

  // Books | actions: under the spread, edge to edge with it, when the book shows two pages; else across the foot.
  // The books, and the actions: in a row across the foot (or under the spread), or stacked beside a
  // wide spread, each column level with its bottom and in line with the name (left) and close (right).
  const bookTabs = (stacked = false) => (
    <nav className={`flex ${stacked ? 'flex-col items-end gap-2' : 'flex-wrap gap-x-5 gap-y-1 md:gap-x-[26px]'}`} aria-label="Books">
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
  )
  const bookActions = (stacked = false) => (
    <div className={`flex whitespace-nowrap ${stacked ? 'flex-col items-end gap-2' : 'flex-wrap gap-x-5 gap-y-1 md:justify-end md:gap-x-[26px]'}`}>
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
      {enquiry && (
        <a href={enquiry} className="intro-write uppercase underline decoration-2 underline-offset-[5px] hover:opacity-60" style={write('Book her →')}>
          {division === 'men' ? 'Book him →' : 'Book her →'}
        </a>
      )}
    </div>
  )
  const rowCls = 'text-detail font-bold uppercase'
  const actionsRow = (className: string, style?: React.CSSProperties) => (
    <div className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 ${rowCls} ${className}`} style={{ ...narrow, ...style }}>
      {bookTabs()}
      {bookActions()}
    </div>
  )

  // The side columns sit level with the middle of the pictures, or the middle of the screen without them.
  const leftCol = useRef<HTMLDivElement>(null)
  const rightCol = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!wide) return
    const st = stageRef.current
    const mid = beside && st ? st.getBoundingClientRect().top + top + pageH / 2 : innerHeight / 2
    for (const c of [leftCol.current, rightCol.current]) if (c) c.style.top = `${mid.toFixed(1)}px`
  })

  return (
    <div
      data-model-sheet
      data-intro={intro ? '' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={name}
      className="model-sheet fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg text-fg"
    >
      {wide ? (
        // Top rail, wide: the logo on the left, the name in the middle, close on the right; the same
        // gap above the name as between it and the pictures.
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-8 px-gutter py-[clamp(18px,1.9vw,34px)]">
          <Logo division={division} className="justify-self-start text-[clamp(46px,4.86vw,70px)]" />
          <h1 aria-label={name} className="wordmark whitespace-nowrap uppercase" style={{ fontSize: `clamp(${46 * NAME_PER_LOGO}px, ${4.86 * NAME_PER_LOGO}vw, ${70 * NAME_PER_LOGO}px)` }}>
            <span aria-hidden className="intro-write inline-block" style={write(name)}>{name}</span>
          </h1>
          <div className="flex justify-end">
            <button type="button" onClick={close} aria-label="Close" className="hover:opacity-60">
              <svg viewBox="0 0 24 24" className="size-[26px]" aria-hidden>
                <path d="M3 3l18 18M21 3L3 21" stroke="currentColor" strokeWidth="3" />
              </svg>
            </button>
          </div>
        </header>
      ) : (
        /* Top rail: logo | name | close, then the sizes under them */
        <header className="flex shrink-0 flex-col gap-3 px-gutter pb-3 pt-[clamp(16px,2vw,28px)]">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Logo division={division} className="justify-self-start text-[32px] md:text-[48px]" />
            <h1 aria-label={name} className="wordmark text-center text-[calc(32px*var(--name-per-logo))] uppercase md:text-[calc(48px*var(--name-per-logo))]" style={{ '--name-per-logo': NAME_PER_LOGO } as React.CSSProperties}>
              <span aria-hidden className="intro-write inline-block" style={write(name)}>{name}</span>
            </h1>
            <button type="button" onClick={close} aria-label="Close" className="-m-2 justify-self-end p-2 hover:opacity-60">
              <svg viewBox="0 0 24 24" className="size-6 md:size-[26px]" aria-hidden>
                <path d="M3 3l18 18M21 3L3 21" stroke="currentColor" strokeWidth="3" />
              </svg>
            </button>
          </div>
          {renderStats('flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-detail md:gap-x-[clamp(14px,1.5vw,24px)]')}
        </header>
      )}

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
                      <div className="relative overflow-hidden bg-line" style={{ width: w, height: pageH }}>
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
          <button type="button" tabIndex={-1} aria-hidden data-cursor="grab" className="absolute inset-y-0 left-0 w-1/2" onClick={() => !swipe.current.moved && step(-1)} />
          <button type="button" tabIndex={-1} aria-hidden data-cursor="grab" className="absolute inset-y-0 right-0 w-1/2" onClick={() => !swipe.current.moved && step(1)} />
          <p className="sr-only" aria-live="polite">
            {visible.map((i) => `${pad2(i + 1)} ${slides[i].caption || slides[i].alt}`).join(', ')} of {pad2(N)}
          </p>
          {underSpread && actionsRow('absolute z-20 items-end', { top: top + pageH, height: ROW_H, left, width: frameW })}
        </section>
      )}

      {/* Thumbnails: the whole book at once, as large as fits, in the middle of the stage. */}
      {view === 'thumbnails' && book && (
        <section ref={stageRef} className="relative flex min-h-0 flex-1 flex-col overflow-y-auto" aria-label={`${book.title}, thumbnails`}>
          <ul style={{ ...at(INTRO_AT), gridTemplateColumns: `repeat(${thumbCols}, ${thumbSize}px)`, gap: THUMB_GAP }} className="intro-crop m-auto grid shrink-0 py-4">
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
        </section>
      )}

      {/* The bio: one paragraph in the middle of the screen, writing itself in as it opens. */}
      {segment === 'bio' && bio && (
        <section style={at(INTRO_AT)} className="intro-fade flex min-h-0 flex-1 flex-col overflow-y-auto px-gutter lg:px-[calc(var(--gutter)+230px)]">
          <p className="m-auto max-w-[44ch] whitespace-pre-line py-8 text-center text-[clamp(19px,1.7vw,27px)] leading-[1.4] tracking-[-0.01em]">
            <TypeText text={bio} at={150} ms={9} />
          </p>
        </section>
      )}

      {/* Wide: the sizes down the left and the books and actions down the right, level with the
          middle of the pictures (else of the screen), in line with the name's margins. */}
      {wide && (
        <>
          <div ref={leftCol} className="absolute left-[var(--gutter)] z-20 -translate-y-1/2" style={{ top: '50%' }}>
            {renderStats('text-detail flex flex-col items-start gap-2')}
          </div>
          <div ref={rightCol} className={`absolute right-[var(--gutter)] z-20 flex -translate-y-1/2 flex-col items-end gap-6 ${rowCls}`} style={{ ...narrow, top: '50%' }}>
            {bookTabs(true)}
            {bookActions(true)}
          </div>
        </>
      )}

      {/* Books | counter | actions, then the ruler across the full width */}
      <div className="flex shrink-0 flex-col gap-2.5 pb-[clamp(14px,1.4vw,20px)] pt-3">
        {!underSpread && !wide && actionsRow('px-gutter')}

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
