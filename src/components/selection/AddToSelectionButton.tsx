'use client'

import { DivisionMark } from '@/components/brand/Marks'
import type { TalentCard } from '@/sanity/lib/types'
import { useSelection } from './SelectionProvider'

/** `compact` is the round "+"; `plain` draws it on the page rather than over a picture (the list). */
export function AddToSelectionButton({ talent, compact, plain }: { talent: TalentCard; compact?: boolean; plain?: boolean }) {
  const { has, toggle } = useSelection()
  const selected = has(talent._id)
  return (
    <button
      type="button"
      aria-label={compact ? `Select ${talent.name}` : undefined}
      onClick={() => toggle(talent)}
      aria-pressed={selected}
      className={
        compact
          ? `grid size-8 place-items-center rounded-full border text-lg leading-none backdrop-blur ${selected ? 'border-fg bg-fg text-bg' : plain ? 'border-current' : 'border-white/70 bg-white/60'}`
          : `border px-5 py-3 text-[14px] font-bold uppercase ${selected ? 'border-fg bg-fg text-bg' : 'border-fg'}`
      }
    >
      {compact ? (selected ? <DivisionMark division={talent.division} size={13} /> : '+') : selected ? 'Selected' : 'Add to selection'}
    </button>
  )
}
