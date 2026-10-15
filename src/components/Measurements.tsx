'use client'

import { useState } from 'react'
import { cmToFeet, cmToInches } from '@/lib/units'
import type { Division, Measurements as M } from '@/sanity/lib/types'

export type Unit = 'cm' | 'in'

/** [label, value] pairs for the stats that are filled in. Stored in cm; shoes stay EU. */
export function measurementRows(m: M, division: Division, unit: Unit): [string, string | number][] {
  const len = (v?: number) => v && (unit === 'cm' ? v : cmToInches(v))
  const rows: [string, string | number | undefined][] = [
    ['Height', m.height && (unit === 'cm' ? `${m.height} cm` : cmToFeet(m.height))],
    [division === 'men' ? 'Chest' : 'Bust', len(m.bust)],
    ['Waist', len(m.waist)],
    ['Hips', len(m.hips)],
    ['Shoes', m.shoes && `${m.shoes} EU`],
    ['Hair', m.hair],
    ['Eyes', m.eyes],
  ]
  return rows.filter((r): r is [string, string | number] => !!r[1])
}

/** Stored in cm; shown in feet/inches first, cm one tap away. Shoes stay EU. */
export function Measurements({ m, division }: { m?: M; division: Division }) {
  const [unit, setUnit] = useState<Unit>('in')
  if (!m) return null
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm uppercase tracking-wide">
        {measurementRows(m, division, unit).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="label flex gap-3" role="group" aria-label="Units">
        {(['in', 'cm'] as Unit[]).map((u) => (
          <button key={u} type="button" onClick={() => setUnit(u)} aria-pressed={unit === u} className={unit === u ? 'text-fg' : 'text-muted hover:text-fg'}>
            {u.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
