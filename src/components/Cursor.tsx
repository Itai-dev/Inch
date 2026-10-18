'use client'

/**
 * The site's pointer, drawn (so it stays sharp at any size) and larger than the system's: an
 * arrow; a pointing finger over anything that can be clicked; a text cursor over text and fields;
 * an open hand over things that can be picked up (anything with data-cursor="grab": the magazine's
 * pages, the model book, the contact prints), closing while it holds them. Mouse only: on touch
 * the page has no pointer. An element can ask for a kind with data-cursor.
 */
import { useEffect, useRef } from 'react'
import { HandIcon } from './HandCursor'

type Kind = 'arrow' | 'finger' | 'text' | 'grab'

const CLICKABLE =
  'a[href], button, [role=button], [role=radio], [role=option], [role=tab], [role=checkbox], [role=switch], label, summary, select, input[type=checkbox], input[type=radio], input[type=submit], input[type=button], input[type=file], [role=slider]'
const FIELD = 'input, textarea, [contenteditable=""], [contenteditable=true]'

/** What the pointer should be over `el`: its own data-cursor, else clickable, a field, text, or the arrow. */
function kindAt(el: Element | null): Kind {
  if (!el) return 'arrow'
  const own = el.closest<HTMLElement>('[data-cursor]')
  const click = el.closest(CLICKABLE)
  // The nearer one wins: a button inside a grabbable area is still clicked with the finger.
  if (own && (!click || own.contains(click) === false || own === click)) return (own.dataset.cursor as Kind) || 'arrow'
  if (click) return el.closest(FIELD) && !el.closest('input[type=checkbox], input[type=radio]') ? 'text' : 'finger'
  if (el.closest(FIELD)) return 'text'
  const hasText = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
  return hasText && getComputedStyle(el).userSelect !== 'none' ? 'text' : 'arrow'
}

/** Each kind: its size (px) and where its point is (share of the size). */
const SHAPE: Record<Kind, { px: number; x: number; y: number }> = {
  arrow: { px: 30, x: 0.17, y: 0.17 },
  finger: { px: 42, x: 0.34, y: 0.1 },
  text: { px: 30, x: 0.5, y: 0.5 },
  grab: { px: 46, x: 0.5, y: 0.5 },
}

const halo = { stroke: '#fff', strokeWidth: 4.2 }
const line = { stroke: '#0a0a0a', strokeWidth: 1.7 }

function Icon({ kind }: { kind: Exclude<Kind, 'grab'> }) {
  const paths =
    kind === 'finger'
      ? [
          'M22 14a8 8 0 0 1-8 8',
          'M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2',
          'M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1',
          'M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10',
          'M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
        ]
      : ['M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1', 'M7 22h1a4 4 0 0 0 4-4v-1', 'M7 2h1a4 4 0 0 1 4 4v1']
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" className="block size-full overflow-visible">
      {paths.map((d) => (
        <path key={`w${d}`} d={d} {...halo} />
      ))}
      {paths.map((d) => (
        <path key={d} d={d} {...line} />
      ))}
    </svg>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="block size-full overflow-visible">
      <path d="M4.04 4.69a.5.5 0 0 1 .65-.65l16 6.5a.5.5 0 0 1-.06.95l-6.13 1.58a2 2 0 0 0-1.43 1.43l-1.58 6.13a.5.5 0 0 1-.95.06z" fill="#0a0a0a" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  )
}

export function Cursor() {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el || !matchMedia('(pointer: fine)').matches) return
    const root = document.documentElement
    let kind: Kind = 'arrow'
    let held = false
    const show = (k: Kind, x: number, y: number) => {
      if (k !== kind) {
        kind = k
        el.dataset.kind = k
      }
      const s = SHAPE[k]
      el.style.width = el.style.height = `${s.px}px`
      el.style.transform = `translate(${(x - s.px * s.x).toFixed(1)}px, ${(y - s.px * s.y).toFixed(1)}px)`
      el.style.opacity = '1'
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        el.style.opacity = '0'
        delete root.dataset.cursorOn
        return
      }
      root.dataset.cursorOn = ''
      // While something is held, the hand stays a hand wherever it goes.
      show(held && kind === 'grab' ? 'grab' : kindAt(e.target as Element), e.clientX, e.clientY)
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      held = true
      el.dataset.held = ''
    }
    const up = () => {
      held = false
      delete el.dataset.held
    }
    const leave = (e: MouseEvent) => {
      if (!e.relatedTarget) el.style.opacity = '0'
    }
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerdown', down, { passive: true })
    addEventListener('pointerup', up, { passive: true })
    addEventListener('pointercancel', up, { passive: true })
    document.addEventListener('mouseout', leave)
    return () => {
      removeEventListener('pointermove', move)
      removeEventListener('pointerdown', down)
      removeEventListener('pointerup', up)
      removeEventListener('pointercancel', up)
      document.removeEventListener('mouseout', leave)
      delete root.dataset.cursorOn
    }
  }, [])

  return (
    <div ref={box} aria-hidden data-kind="arrow" className="site-cursor group/cur pointer-events-none fixed left-0 top-0 z-[2147483647] opacity-0">
      <span className="hidden size-full group-data-[kind=arrow]/cur:block">
        <Arrow />
      </span>
      <span className="hidden size-full transition-transform duration-100 group-data-[kind=finger]/cur:block group-data-[held]/cur:scale-90">
        <Icon kind="finger" />
      </span>
      <span className="hidden size-full group-data-[kind=text]/cur:block">
        <Icon kind="text" />
      </span>
      <span className="relative hidden size-full group-data-[kind=grab]/cur:block">
        <span className="absolute inset-0 group-data-[held]/cur:hidden [&_svg]:!size-full">
          <HandIcon kind="open" />
        </span>
        <span className="absolute inset-0 hidden group-data-[held]/cur:block [&_svg]:!size-full">
          <HandIcon kind="held" />
        </span>
      </span>
    </div>
  )
}
