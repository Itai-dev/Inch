'use client'

import { useEffect, useRef } from 'react'
import { DivisionMark } from '@/components/brand/Marks'
import type { Division } from '@/sanity/lib/types'

export type CardStat = [label: string, value: string | number | undefined]

/**
 * The application as a comp card: heavy warm-white paper (.paper) with a fine outline, lifted off the page, and
 * turned a little toward the mouse wherever it is (also while filling in the form). It fills in while the form is filled in: the name, the stats, then the photos. The
 * name isn't set between the ’ ’ marks (those are for INCH” models); the card carries the
 * ” logo instead (DOT.: the ■).
 */
export function CompCard({
  brand,
  division,
  name,
  stats,
  photos,
  contact,
  flat = false,
  still = false,
  className = '',
}: {
  brand: string
  division: Division
  name: string
  stats: CardStat[]
  photos: { label: string; url?: string }[]
  contact: string[]
  /** No lift or tilt (the folded card on phones). */
  flat?: boolean
  /** The look without the pointer tilt (a copy that is being moved about). */
  still?: boolean
  className?: string
}) {
  const card = useRef<HTMLDivElement>(null)

  // Face the pointer, a few degrees at most, wherever it is on the page; the shadow falls
  // away from it. Mouse only, and not with reduced motion.
  useEffect(() => {
    const el = card.current
    if (flat || still || !el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const face = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const clamp = (v: number) => Math.max(-1, Math.min(1, v))
        const x = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth / 2))
        const y = clamp((e.clientY - (r.top + r.height / 2)) / (innerHeight / 2))
        // Well felt: up to ~11° each way, and lifted higher still while the pointer is on it.
        const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
        el.style.transform = `perspective(1000px) rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 11).toFixed(2)}deg) translateY(${over ? -14 : -6}px) scale(${over ? 1.03 : 1})`
        el.style.boxShadow = `${(-14 - x * 26).toFixed(1)}px ${(44 - y * 18 + (over ? 12 : 0)).toFixed(1)}px ${over ? 40 : 28}px -26px rgb(0 0 0 / 0.42), 0 2px 8px rgb(0 0 0 / 0.07)`
      })
    }
    const rest = () => {
      cancelAnimationFrame(frame)
      el.style.transform = ''
      el.style.boxShadow = ''
    }
    window.addEventListener('pointermove', face)
    document.documentElement.addEventListener('pointerleave', rest)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', face)
      document.documentElement.removeEventListener('pointerleave', rest)
    }
  }, [flat, still])

  return (
    <div
      ref={card}
      // Light grey, also on DOT.'s black page: its own light colours. (Folded, it takes the page's.)
      style={flat ? undefined : ({ '--bg': '#efede8', '--fg': '#0a0a0a', '--muted': '#6b6965', '--line': '#dedbd4' } as React.CSSProperties)}
      className={`flex flex-col gap-6 bg-bg p-[clamp(22px,2.6vw,40px)] text-fg ${flat ? '' : 'paper border border-[#d3d0c9] shadow-[-8px_30px_20px_-24px_rgb(0_0_0/0.32),0_2px_8px_rgb(0_0_0/0.06)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]'} ${className}`}
    >
      <div className="label flex items-start justify-between text-[11px] text-muted">
        <span>{brand} — Application</span>
        <span className="text-fg">
          <DivisionMark division={division} size={22} />
        </span>
      </div>

      <p className={`wordmark text-[clamp(34px,3.4vw,54px)] uppercase ${name ? '' : 'text-muted/50'}`}>{name || 'Your name'}</p>

      <dl className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] uppercase">
        {stats.map(([k, v]) => (
          <div key={k} className={v === undefined || v === '' ? 'text-muted/60' : ''}>
            <dt className="inline" style={{ fontStretch: '80%' }}>{k}</dt> <dd className="inline font-bold normal-case">{v === undefined || v === '' ? '—' : v}</dd>
          </div>
        ))}
      </dl>

      {/* The four digitals in a row; a new one is pasted down onto its spot (keyed by the picture, so a replacement is too). */}
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${photos.length}, minmax(0, 1fr))` }}>
        {photos.map((p) => (
          <div key={p.label} className="relative aspect-[3/4] overflow-hidden border border-dashed border-muted/40">
            {p.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.url} src={p.url} alt={p.label} className={`absolute inset-0 size-full object-cover ${still || flat ? '' : 'photo-paste'}`} />
            ) : (
              <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-[0.15em] text-muted">{p.label}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-4 text-[11px] uppercase tracking-[0.1em] text-muted">
        {contact.map((c) => (
          <span key={c} className="truncate">{c}</span>
        ))}
      </div>
    </div>
  )
}
