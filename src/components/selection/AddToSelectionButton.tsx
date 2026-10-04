'use client'

import type { TalentCard } from '@/sanity/lib/types'
import { useSelection } from './SelectionProvider'

export function AddToSelectionButton({ talent, compact }: { talent: TalentCard; compact?: boolean }) {
  const { has, toggle } = useSelection()
  const selected = has(talent._id)
  return (
    <button
      type="button"
      onClick={() => toggle(talent)}
      aria-pressed={selected}
      className={
        compact
          ? `grid size-8 place-items-center rounded-full border text-lg leading-none backdrop-blur ${selected ? 'border-fg bg-fg text-bg' : 'border-white/70 bg-white/60'}`
          : `border px-5 py-3 text-sm uppercase tracking-wide ${selected ? 'border-fg bg-fg text-bg' : 'border-fg'}`
      }
    >
      {compact ? (selected ? '✓' : '+') : selected ? 'In selection' : 'Add to selection'}
    </button>
  )
}
