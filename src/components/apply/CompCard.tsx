'use client'

import { useRef } from 'react'
import { DivisionMark } from '@/components/brand/Marks'
import type { Division } from '@/sanity/lib/types'

export type CardStat = [label: string, value: string | number | undefined]

/**
 * The application as a comp card: white, lifted off the page, tilting a little after the
 * mouse. It fills in while the form is filled in: the name, the stats, then the photos. The
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
  className?: string
}) {
  const card = useRef<HTMLDivElement>(null)

  // Tilt toward the pointer, a few degrees at most; the shadow falls away from it.
  const tilt = (e: React.PointerEvent) => {
    const el = card.current
    if (!el || e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transition = 'transform 0.15s ease-out, box-shadow 0.15s ease-out'
    el.style.transform = `perspective(1100px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) translateY(-4px)`
    el.style.boxShadow = `${(-x * 22).toFixed(1)}px ${(30 - y * 16).toFixed(1)}px 60px -24px rgb(0 0 0 / 0.32), 0 2px 8px rgb(0 0 0 / 0.06)`
  }
  const rest = () => {
    const el = card.current
    if (!el) return
    el.style.transition = 'transform 0.7s var(--ease-out), box-shadow 0.7s var(--ease-out)'
    el.style.transform = ''
    el.style.boxShadow = ''
  }

  return (
    <div
      ref={card}
      onPointerMove={flat ? undefined : tilt}
      onPointerLeave={flat ? undefined : rest}
      // A white card, also on DOT.'s black page: its own light colours. (Folded, it takes the page's.)
      style={flat ? undefined : ({ '--bg': '#fff', '--fg': '#0a0a0a', '--muted': '#6f6f6f', '--line': '#e6e6e6' } as React.CSSProperties)}
      className={`flex flex-col gap-5 bg-bg p-[clamp(20px,2.4vw,36px)] text-fg ${flat ? '' : 'shadow-[0_24px_56px_-24px_rgb(0_0_0/0.28),0_2px_8px_rgb(0_0_0/0.06)] will-change-transform'} ${className}`}
    >
      <div className="label flex items-start justify-between text-[11px] text-muted">
        <span>{brand} — Application</span>
        <span className="text-fg">
          <DivisionMark division={division} size={22} />
        </span>
      </div>

      <p className={`wordmark text-[clamp(34px,3.4vw,52px)] uppercase ${name ? '' : 'text-muted/50'}`}>{name || 'Your name'}</p>

      <dl className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] uppercase">
        {stats.map(([k, v]) => (
          <div key={k} className={v === undefined || v === '' ? 'text-muted/60' : ''}>
            <dt className="inline font-bold" style={{ fontStretch: '80%' }}>{k}</dt> <dd className="inline normal-case">{v === undefined || v === '' ? '—' : v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-3 gap-[3px]">
        {photos.map((p) => (
          <div key={p.label} className="relative aspect-[3/4] overflow-hidden border border-dashed border-muted/40">
            {p.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.url} alt={p.label} className="absolute inset-0 size-full object-cover" />
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
