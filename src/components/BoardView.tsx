'use client'

/**
 * The board as thumbnails or as a list, with the switch above it. The choice is remembered on
 * this device. Both views come rendered from the server; this only shows one.
 */
import { useSyncExternalStore } from 'react'

type View = 'grid' | 'list'
const KEY = 'inch:board-view'
const listeners = new Set<() => void>()

function read(): View {
  try {
    return localStorage.getItem(KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}
function write(v: View) {
  try {
    localStorage.setItem(KEY, v)
  } catch {}
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function BoardView({ grid, list }: { grid: React.ReactNode; list: React.ReactNode }) {
  const view = useSyncExternalStore(subscribe, read, () => 'grid' as View)
  const option = (v: View, label: string) => (
    <button type="button" aria-pressed={view === v} onClick={() => write(v)} className={`${view === v ? 'border-b border-fg' : 'text-muted hover:text-fg'}`}>
      {label}
    </button>
  )
  return (
    <>
      <div className="label mb-8 flex items-center justify-end gap-6">
        <div role="group" aria-label="View" className="flex gap-5">
          {option('grid', 'Thumbnails')}
          {option('list', 'List')}
        </div>
      </div>
      {view === 'grid' ? grid : list}
    </>
  )
}
