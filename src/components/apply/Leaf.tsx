/**
 * A sheet that bends as it turns, as the magazine's pages do: cut across its height into thin
 * strips, each hinged to the bottom of the one before, so each can turn a little further than the
 * one before it and the free edge leads (or lags) and the sheet curves. It turns about its top edge
 * (rotateX). Its front and back are drawn whole and sliced into the strips; each face shades a
 * touch as it turns from the light. Lay it in a box with perspective (and preserve-3d).
 */
export const LEAF_STRIPS = 12

function LeafStrip({ k, n, front, back, shade }: { k: number; n: number; front: React.ReactNode; back: React.ReactNode; shade: boolean }) {
  // Faces overlap the next strip by a pixel so no seam shows; the sheet inside stays aligned.
  const slice = (i: number) => ({ height: `calc(${n} * (100% - 1px))`, top: `calc(${-i} * (100% - 1px))` })
  return (
    <div
      data-leaf-strip
      className="absolute inset-x-0 origin-top [transform-style:preserve-3d]"
      style={k === 0 ? { top: 0, height: `${100 / n}%` } : { top: '100%', height: '100%' }}
    >
      <div className="absolute inset-x-0 top-0 h-[calc(100%+1px)] overflow-hidden [backface-visibility:hidden]">
        <div className="absolute inset-x-0" style={slice(k)}>
          {front}
        </div>
        {shade && <span aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 'var(--sf, 0)' }} />}
      </div>
      {/* (Turned over, the sheet's back reads the right way up, its free edge at the top.) */}
      <div className="absolute inset-x-0 top-0 h-[calc(100%+1px)] overflow-hidden [backface-visibility:hidden] [transform:rotateX(180deg)]">
        <div className="absolute inset-x-0" style={slice(n - 1 - k)}>
          {back}
        </div>
        {shade && <span aria-hidden className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 'var(--sb, 0)' }} />}
      </div>
      {k + 1 < n && <LeafStrip k={k + 1} n={n} front={front} back={back} shade={shade} />}
    </div>
  )
}

/** `shade`: each face darkens a touch as it turns from the light (over its whole strip: only for a sheet that fills its box). */
export function Leaf({ front, back, strips = LEAF_STRIPS, shade = true, className = '' }: { front: React.ReactNode; back: React.ReactNode; strips?: number; shade?: boolean; className?: string }) {
  return (
    <div data-leaf={strips} className={`absolute inset-0 [transform-style:preserve-3d] ${className}`}>
      <LeafStrip k={0} n={strips} front={front} back={back} shade={shade} />
    </div>
  )
}

/**
 * Turns a leaf: its top strip at `angle` (deg, about its top edge; positive brings its foot toward
 * the eye), each strip after it further by up to `bend` at the free edge (the magazine's curve).
 * Returns the angle of each strip.
 */
export function bendLeaf(leaf: HTMLElement, angle: number, bend: number) {
  const strips = leaf.querySelectorAll<HTMLElement>('[data-leaf-strip]')
  const n = strips.length
  const angles: number[] = []
  let before = 0
  strips.forEach((strip, i) => {
    const a = angle + bend * ((i + 1) / n) ** 1.6
    strip.style.transform = `rotateX(${(a - before).toFixed(2)}deg)` // relative to the strip before
    before = a
    angles.push(a)
    // Light from the front: the face shades a touch as it turns away.
    const c = Math.cos((a * Math.PI) / 180)
    strip.style.setProperty('--sf', (0.06 * (1 - c)).toFixed(3))
    strip.style.setProperty('--sb', (0.05 * (1 + c)).toFixed(3))
  })
  return angles
}
