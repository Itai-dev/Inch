import { QuoteStroke } from '@/components/brand/Marks'
import type { Division } from '@/sanity/lib/types'

export type CardStat = [label: string, value: string | number | undefined]

/**
 * The application as an INCH” comp card. It fills in while the form is filled in: the name
 * between the ’ ’ marks (DOT.: a ■ full stop), the stats, then the photos.
 */
export function CompCard({
  brand,
  division,
  name,
  stats,
  photos,
  contact,
  className = '',
}: {
  brand: string
  division: Division
  name: string
  stats: CardStat[]
  photos: { label: string; url?: string }[]
  contact: string[]
  className?: string
}) {
  const dot = division === 'men'
  return (
    <div className={`flex flex-col gap-5 bg-surface p-[clamp(20px,2.4vw,36px)] ${className}`}>
      <div className="label flex justify-between text-[11px] text-muted">
        <span>{brand} — Application</span>
        <span>Comp card</span>
      </div>

      <p className="wordmark flex items-start gap-2 text-[clamp(34px,3.4vw,52px)] uppercase">
        {!dot && <QuoteStroke side="left" height={20} className="mt-[0.06em] shrink-0" />}
        <span className={name ? '' : 'text-muted/50'}>{name || 'Your name'}</span>
        {dot ? <span aria-hidden className="mt-auto mb-[0.12em] inline-block size-[0.2em] shrink-0 bg-current" /> : <QuoteStroke side="right" height={20} className="mt-[0.06em] shrink-0" />}
      </p>

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
