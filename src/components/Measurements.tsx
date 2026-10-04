import type { Division, Measurements as M } from '@/sanity/lib/types'

export function Measurements({ m, division }: { m?: M; division: Division }) {
  if (!m) return null
  const rows: [string, string | number | undefined][] = [
    ['Height', m.height && `${m.height} cm`],
    [division === 'men' ? 'Chest' : 'Bust', m.bust],
    ['Waist', m.waist],
    ['Hips', m.hips],
    ['Shoes', m.shoes],
    ['Hair', m.hair],
    ['Eyes', m.eyes],
  ]
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm uppercase tracking-wide">
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}
