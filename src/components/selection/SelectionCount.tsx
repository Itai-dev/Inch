'use client'

import { useSelection } from './SelectionProvider'

export function SelectionCount() {
  const { items, setOpen } = useSelection()
  return (
    <button onClick={() => setOpen(true)} aria-label="Open selection">
      Selection ({items.length})
    </button>
  )
}
