'use client'

import { useState } from 'react'
import { cmToFeet, cmToInches } from '@/lib/units'
import type { Division, Measurements as M } from '@/sanity/lib/types'

export type Unit = 'cm' | 'in'

/** [label, value] pairs for the stats that are filled in. Stored in cm; shoes stay EU. */
export function measurementRows(m: M, division: Division, unit: Unit): [string, string | number][] {
  const len = (v?: number) => v && (unit === 'cm' ? `${v} cm` : cmToInches(v))
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
      <UnitToggle unit={unit} onChange={setUnit} className="label w-fit" />
    </div>
  )
}

/** IN / CM as a switch: a quiet grey thumb slides under the chosen unit. */
export function UnitToggle({ unit, onChange, className = '' }: { unit: Unit; onChange: (u: Unit) => void; className?: string }) {
  return (
    <div role="radiogroup" aria-label="Units" className={`relative inline-grid grid-cols-2 bg-surface p-[2px] ${className}`}>
      <span
        aria-hidden
        className="absolute inset-y-[2px] left-[2px] w-[calc(50%-2px)] bg-bg shadow-[0_1px_3px_rgb(0_0_0/0.18)] transition-transform duration-300 ease-[var(--ease-out)]"
        style={{ transform: unit === 'cm' ? 'translateX(100%)' : 'none' }}
      />
      {(['in', 'cm'] as Unit[]).map((u) => (
        <button
          key={u}
          type="button"
          role="radio"
          aria-checked={unit === u}
          onClick={() => onChange(u)}
          className={`relative px-[0.7em] py-[0.3em] leading-none transition-colors duration-300 ${unit === u ? 'text-fg' : 'text-muted hover:text-fg'}`}
        >
          {u.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
