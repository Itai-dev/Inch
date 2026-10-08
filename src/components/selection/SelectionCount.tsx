'use client'

import { useSelection } from './SelectionProvider'

export function SelectionCount() {
  const { items, setOpen } = useSelection()
  return (
    <button onClick={() => setOpen(true)} className="nav-item uppercase" aria-label="Open selection">
      Selection ({items.length})
    </button>
  )
}
