'use client'

/**
 * A sheet that unfolds like paper (phones: the comp card under its strip). It is folded once
 * across its middle and tucked up under the strip: opening, the upper half swings down from the
 * strip while the lower half, hinged to it, opens out after it and settles with a little give;
 * closing folds it back up the same way. Each half darkens as it turns away from the light. The
 * space it takes on the page opens and closes with it.
 */
import { useEffect, useRef, useState } from 'react'

const EASE_OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)'
const EASE_IN_OUT = 'cubic-bezier(0.55, 0, 0.35, 1)'
const OPEN_MS = 760
const CLOSE_MS = 560

export function PaperFold({ open, children, className = '' }: { open: boolean; children: React.ReactNode; className?: string }) {
  // Shown while open, and while folding away (set as it is asked to close, cleared once folded).
  const [closing, setClosing] = useState(false)
  const [was, setWas] = useState(open)
  if (was !== open) {
    setWas(open)
    setClosing(!open)
  }
  const shown = open || closing
  const wrap = useRef<HTMLDivElement>(null)
  const top = useRef<HTMLDivElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const shadeTop = useRef<HTMLSpanElement>(null)
  const shadeBottom = useRef<HTMLSpanElement>(null)
  const first = useRef(true)

  useEffect(() => {
    const w = wrap.current
    const t = top.current
    const b = bottom.current
    // Already open when the page first draws it: no movement then.
    if (first.current) {
      first.current = false
      if (open) return
    }
    if (!shown || !w || !t || !b) return
    const h = t.offsetHeight
    const opening = open
    // Reduced motion: no movement (it is simply there, or gone).
    const dur = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : opening ? OPEN_MS : CLOSE_MS
    const opts = { duration: dur, fill: 'both' as const }
    // Folded: the upper half turned up flat under the strip, the lower half doubled back under it.
    const folded = { top: 'rotateX(-88deg)', bottom: 'rotateX(178deg)' }
    const anims = opening
      ? [
          w.animate([{ height: '0px' }, { height: `${h}px` }], { ...opts, easing: EASE_OUT }),
          t.animate(
            [
              { transform: folded.top, easing: EASE_OUT },
              { transform: 'rotateX(4deg)', offset: 0.62, easing: EASE_IN_OUT },
              { transform: 'rotateX(0deg)' },
            ],
            opts,
          ),
          // The lower half follows a beat behind, opens a touch too far (paper gives), and settles.
          b.animate(
            [
              { transform: folded.bottom, offset: 0 },
              { transform: folded.bottom, offset: 0.12, easing: EASE_OUT },
              { transform: 'rotateX(-7deg)', offset: 0.78, easing: EASE_IN_OUT },
              { transform: 'rotateX(0deg)' },
            ],
            opts,
          ),
          shadeTop.current?.animate([{ opacity: 0.4 }, { opacity: 0, offset: 0.7 }, { opacity: 0 }], opts),
          shadeBottom.current?.animate([{ opacity: 0.55 }, { opacity: 0.25, offset: 0.5 }, { opacity: 0 }], opts),
        ]
      : [
          w.animate([{ height: `${h}px` }, { height: '0px' }], { ...opts, easing: EASE_IN_OUT }),
          t.animate([{ transform: 'rotateX(0deg)', easing: EASE_IN_OUT }, { transform: folded.top }], opts),
          b.animate(
            [
              { transform: 'rotateX(0deg)', easing: EASE_IN_OUT },
              { transform: folded.bottom, offset: 0.85 },
              { transform: folded.bottom },
            ],
            opts,
          ),
          shadeTop.current?.animate([{ opacity: 0 }, { opacity: 0.4 }], opts),
          shadeBottom.current?.animate([{ opacity: 0 }, { opacity: 0.55 }], opts),
        ]
    const sizing = anims[0]
    if (sizing) sizing.onfinish = () => {
      anims.forEach((a) => a?.cancel())
      if (!opening) setClosing(false)
    }
    return () => anims.forEach((a) => a?.cancel())
    // Runs when it is asked to open or close.
  }, [open, shown])

  if (!shown) return null
  const shade = 'pointer-events-none absolute inset-0 bg-black'
  return (
    <div ref={wrap} className={`overflow-visible ${className}`} style={{ perspective: '900px' }}>
      {/* The upper half (the whole sheet laid out, its upper half shown), hinged at the strip. */}
      <div ref={top} className="relative origin-top [transform-style:preserve-3d]">
        <div style={{ clipPath: 'inset(0 0 50% 0)' }}>
          {children}
          <span ref={shadeTop} className={shade} style={{ opacity: 0 }} />
        </div>
        {/* The lower half, hinged at the middle of the sheet to the upper half. */}
        <div ref={bottom} aria-hidden className="absolute inset-0 [transform-origin:50%_50%]" style={{ clipPath: 'inset(50% 0 0 0)' }}>
          {children}
          <span ref={shadeBottom} className={shade} style={{ opacity: 0 }} />
        </div>
      </div>
    </div>
  )
}
