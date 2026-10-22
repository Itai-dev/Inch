'use client'

/**
 * A sheet that unfolds like a page (phones: the comp card under its strip). Folded, it is turned
 * up away from the eye under the strip; opening, it swings down and toward you, bending as it
 * comes as the magazine's pages do (its foot lags and catches up); closing, it swings back the
 * same way. The space it takes on the page opens and closes with it.
 */
import { useEffect, useRef, useState } from 'react'
import { bendLeaf, Leaf } from './Leaf'

/** How long it takes to unfold. */
export const FOLD_OPEN_MS = 760
const CLOSE_MS = 560
/** Folded away: turned up, nearly edge on (deg). */
const FOLDED = -88
const STRIPS = 10
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

export function PaperFold({ open, children, className = '' }: { open: boolean; children: React.ReactNode; className?: string }) {
  // Shown while open, and while folding away; moving while it turns (then the sheet is drawn as a
  // bending leaf; at rest it is simply the sheet).
  const [closing, setClosing] = useState(false)
  const [moving, setMoving] = useState(false)
  const [was, setWas] = useState(open)
  if (was !== open) {
    setWas(open)
    setClosing(!open)
    setMoving(true)
  }
  const shown = open || closing
  const wrap = useRef<HTMLDivElement>(null)
  const sizer = useRef<HTMLDivElement>(null)
  const leafBox = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const w = wrap.current
    const sz = sizer.current
    const box = leafBox.current
    const leaf = box?.querySelector<HTMLElement>('[data-leaf]')
    if (!moving || !w || !sz || !box || !leaf) return
    const H = sz.offsetHeight
    box.style.height = `${H}px`
    const opening = open
    // Reduced motion: no movement (it is simply there, or gone).
    const dur = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : opening ? FOLD_OPEN_MS : CLOSE_MS
    const t0 = performance.now()
    let raf = 0
    const draw = () => {
      const p = Math.min(1, (performance.now() - t0) / dur)
      const e = opening ? easeOut(p) : easeInOut(p)
      const angle = opening ? FOLDED * (1 - e) : FOLDED * e
      // The foot lags behind the way it is going, most in the middle of the move.
      const bend = Math.sin(Math.PI * p) * (opening ? -55 : 40)
      const angles = bendLeaf(leaf, angle, bend)
      // The room it takes: how tall it stands on the page as it turns.
      const tall = angles.reduce((sum, a) => sum + Math.max(0, Math.cos((a * Math.PI) / 180)), 0) * (H / angles.length)
      w.style.height = `${tall.toFixed(1)}px`
      if (p < 1) raf = requestAnimationFrame(draw)
      else {
        w.style.height = ''
        setMoving(false)
        if (!opening) setClosing(false)
      }
    }
    draw()
    return () => cancelAnimationFrame(raf)
    // Runs when it is asked to open or close.
  }, [open, moving])

  if (!shown) return null
  return (
    <div ref={wrap} className={`relative ${className}`} style={{ perspective: '900px', height: moving ? 0 : undefined }}>
      {/* The sheet itself (at rest), which also gives the leaf its height while it turns. */}
      <div ref={sizer} className={moving ? 'invisible' : ''} aria-hidden={moving || undefined}>
        {children}
      </div>
      {moving && (
        <div ref={leafBox} aria-hidden className="absolute inset-x-0 top-0 [transform-style:preserve-3d]">
          <Leaf strips={STRIPS} front={children} back={<div className="paper absolute inset-0" />} />
        </div>
      )}
    </div>
  )
}
