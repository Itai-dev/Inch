'use client'

import { useState } from 'react'
import { cmToFeet, cmToInches } from '@/lib/units'
import type { Division, Measurements as M } from '@/sanity/lib/types'

type Unit = 'cm' | 'in'

/** Stored in cm; viewers can switch to feet/inches. Shoes stay EU. */
export function Measurements({ m, division }: { m?: M; division: Division }) {
  const [unit, setUnit] = useState<Unit>('cm')
  if (!m) return null
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
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm uppercase tracking-wide">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="label flex gap-3" role="group" aria-label="Units">
        {(['cm', 'in'] as Unit[]).map((u) => (
          <button key={u} type="button" onClick={() => setUnit(u)} aria-pressed={unit === u} className={unit === u ? 'text-fg' : 'text-muted hover:text-fg'}>
            {u}
          </button>
        ))}
      </div>
    </div>
  )
}
