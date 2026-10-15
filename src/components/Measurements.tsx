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
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm uppercase">
        {measurementRows(m, division, unit).map(([k, v]) => (
          <div key={k} className="contents">
            <dt>{k}</dt>
            <dd className="font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <UnitToggle unit={unit} onChange={setUnit} className="w-fit text-sm" />
    </div>
  )
}

/**
 * IN / CM, written as such: the chosen unit bold, the other light. Each keeps room for its bold
 * self, so nothing shifts when switching.
 */
export function UnitToggle({ unit, onChange, className = '' }: { unit: Unit; onChange: (u: Unit) => void; className?: string }) {
  const option = (u: Unit) => (
    <button key={u} type="button" role="radio" aria-checked={unit === u} onClick={() => onChange(u)} className="inline-grid uppercase hover:opacity-60">
      <span aria-hidden className="invisible font-bold [grid-area:1/1]">{u}</span>
      <span className={`[grid-area:1/1] ${unit === u ? 'font-bold' : 'font-light'}`}>{u}</span>
    </button>
  )
  return (
    <div role="radiogroup" aria-label="Units" className={`inline-flex items-baseline gap-[0.3em] ${className}`}>
      {option('in')}
      <span aria-hidden className="font-light">/</span>
      {option('cm')}
    </div>
  )
}
