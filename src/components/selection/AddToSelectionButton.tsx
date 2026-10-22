'use client'

import { DivisionMark } from '@/components/brand/Marks'
import type { TalentCard } from '@/sanity/lib/types'
import { useSelection } from './SelectionProvider'

export function AddToSelectionButton({ talent, compact }: { talent: TalentCard; compact?: boolean }) {
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
          ? `grid size-8 place-items-center rounded-full border text-lg leading-none backdrop-blur ${selected ? 'border-fg bg-fg text-bg' : 'border-white/70 bg-white/60'}`
          : `kern border px-5 py-3 text-[14px] font-bold uppercase ${selected ? 'border-fg bg-fg text-bg' : 'border-fg'}`
      }
    >
      {compact ? (selected ? <DivisionMark division={talent.division} size={13} /> : '+') : selected ? 'Selected' : 'Add to selection'}
    </button>
  )
}
