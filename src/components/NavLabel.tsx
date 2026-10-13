import type { ReactNode } from 'react'

/**
 * A menu word that tightens around its own centre. An invisible copy at normal
 * tracking holds the slot's width, so nothing else in the menu moves; the visible
 * copy sits centred on top (see .nav-label in globals.css).
 */
export function NavLabel({ children }: { children: ReactNode }) {
  return (
    <span className="grid">
      <span aria-hidden className="invisible col-start-1 row-start-1 tracking-[-0.02em]">{children}</span>
      <span className="nav-label col-start-1 row-start-1 justify-self-center">{children}</span>
    </span>
  )
}
