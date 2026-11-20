'use client'

import { DivisionMark } from '@/components/brand/Marks'
import type { TalentCard } from '@/sanity/lib/types'
import { useSelection } from './SelectionProvider'

/** `compact` is the round "+", glass over a picture; `onPage` gives it a faint grey fill where it sits on the page (the list). */
export function AddToSelectionButton({ talent, compact, onPage }: { talent: TalentCard; compact?: boolean; onPage?: boolean }) {
  const { has, toggle, setOpen } = useSelection()
  const selected = has(talent._id)
  // Adding her opens the selection, so you see where she went (as on her page); taking her out doesn't.
  const onClick = () => {
    toggle(talent)
    if (!selected) setOpen(true)
  }
  return (
    <button
      type="button"
      aria-label={compact ? `Select ${talent.name}` : undefined}
      onClick={onClick}
      aria-pressed={selected}
      className={
        compact
          ? `grid size-8 place-items-center rounded-full border text-lg leading-none backdrop-blur ${selected ? 'border-fg bg-fg text-bg' : `border-white/70 ${onPage ? 'bg-fg/5' : 'bg-white/60'}`}`
          : `border px-5 py-3 text-[14px] font-bold uppercase ${selected ? 'border-fg bg-fg text-bg' : 'border-fg'}`
      }
    >
      {compact ? (selected ? <DivisionMark division={talent.division} size={13} /> : '+') : selected ? 'Selected' : 'Add to selection'}
    </button>
  )
}
