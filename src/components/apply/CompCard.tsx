'use client'

import { useEffect, useRef } from 'react'
import { DivisionMark } from '@/components/brand/Marks'
import type { Division } from '@/sanity/lib/types'

export type CardStat = [label: string, value: string | number | undefined]

/**
 * The application as a comp card: a light grey card with a fine outline, lifted off the page, and
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

  // Face the pointer, a few degrees at most, wherever it is on the page; the shadow falls
  // away from it. Mouse only, and not with reduced motion.
  useEffect(() => {
    const el = card.current
    if (flat || !el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const face = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const clamp = (v: number) => Math.max(-1, Math.min(1, v))
        const x = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth / 2))
        const y = clamp((e.clientY - (r.top + r.height / 2)) / (innerHeight / 2))
        el.style.transform = `perspective(1100px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`
        el.style.boxShadow = `${(-8 - x * 14).toFixed(1)}px ${(30 - y * 10).toFixed(1)}px 20px -24px rgb(0 0 0 / 0.32), 0 2px 8px rgb(0 0 0 / 0.06)`
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
  }, [flat])

  return (
    <div
      ref={card}
      // Light grey, also on DOT.'s black page: its own light colours. (Folded, it takes the page's.)
      style={flat ? undefined : ({ '--bg': '#f9f9f9', '--fg': '#0a0a0a', '--muted': '#6f6f6f', '--line': '#e6e6e6' } as React.CSSProperties)}
      className={`flex flex-col gap-5 bg-bg p-[clamp(20px,2.2vw,32px)] text-fg ${flat ? '' : 'border border-[#bcbcbc] shadow-[-8px_30px_20px_-24px_rgb(0_0_0/0.32),0_2px_8px_rgb(0_0_0/0.06)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] will-change-transform'} ${className}`}
    >
      <div className="label flex items-start justify-between text-[11px] text-muted">
        <span>{brand} — Application</span>
        <span className="text-fg">
          <DivisionMark division={division} size={22} />
        </span>
      </div>

      <p className={`wordmark text-[clamp(32px,3vw,46px)] uppercase ${name ? '' : 'text-muted/50'}`}>{name || 'Your name'}</p>

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
