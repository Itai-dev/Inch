'use client'

import { useEffect, useRef } from 'react'
import { DivisionMark } from '@/components/brand/Marks'
import type { TalentCard } from '@/sanity/lib/types'
import { useSelection } from './SelectionProvider'

/** How long the button shows her mark before the selection opens, so you see it was pressed. */
const OPEN_AFTER_MS = 500

/** `compact` is the round "+", glass over a picture (on a phone its touch area reaches 12px past the circle); `onPage` gives it a faint grey fill where it sits on the page (the list). */
export function AddToSelectionButton({ talent, compact, onPage }: { talent: TalentCard; compact?: boolean; onPage?: boolean }) {
  const { has, toggle, setOpen } = useSelection()
  const selected = has(talent._id)
  // Adding her opens the selection, so you see where she went (as on her page); taking her out doesn't.
  // It opens a moment later, once the "+" has turned into her mark.
  const openTimer = useRef(0)
  useEffect(() => () => clearTimeout(openTimer.current), [])
  const onClick = () => {
    clearTimeout(openTimer.current)
    toggle(talent)
    if (!selected) openTimer.current = window.setTimeout(() => setOpen(true), OPEN_AFTER_MS)
  }
  return (
    <button
      type="button"
      aria-label={compact ? `Select ${talent.name}` : undefined}
      onClick={onClick}
      aria-pressed={selected}
      className={
        compact
          ? `relative grid size-8 place-items-center rounded-full border before:absolute before:-inset-3 md:before:inset-0 text-lg leading-none backdrop-blur ${selected ? 'border-fg bg-fg text-bg' : `border-white/70 ${onPage ? 'bg-fg/5' : 'bg-white/60'}`}`
          : `border px-5 py-3 text-[14px] font-bold uppercase ${selected ? 'border-fg bg-fg text-bg' : 'border-fg'}`
      }
    >
      {compact ? (selected ? <DivisionMark division={talent.division} size={13} /> : '+') : selected ? 'Selected' : 'Add to selection'}
    </button>
  )
}
