'use client'

/**
 * INCH” — hero: the ” is a window onto the video. On scroll it scales up,
 * zooming into the left stroke until the video fills the screen.
 */
import { useEffect, useState } from 'react'
import { LEFT_PATH, RIGHT_PATH } from '@/components/brand/Marks'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useScrollProgress } from '@/hooks/useScrollProgress'

// ” in its artboard coords (see Marks.tsx).
const BOX = { x: 651, y: 235, w: 617, h: 611 }
// Solid square at the top of the left stroke — the zoom lands inside it.
const FOCUS = { x: 663.5, y: 235, w: 243.9, h: 277.3 }
const START_VMIN = 0.32 // mark height at rest, as a share of the short viewport side
const OPEN_END = 0.85 // scroll share used for opening; the rest holds full screen

const easeInCubic = (t: number) => t * t * t

export function QuoteVideoHero({ video, poster }: { video?: string; poster?: string }) {
  const reduced = useReducedMotion()
  const { ref, progress } = useScrollProgress<HTMLDivElement>()
  const [vp, setVp] = useState({ w: 1440, h: 900 })

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    on()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  const t = reduced ? 1 : easeInCubic(Math.min(1, progress / OPEN_END))
  const open = t >= 1

  // Scale the mark so its height starts at START_VMIN and ends with FOCUS covering the viewport.
  const s0 = (Math.min(vp.w, vp.h) * START_VMIN) / BOX.h
  const s1 = Math.max(vp.w / FOCUS.w, vp.h / FOCUS.h) * 1.05
  const s = s0 * Math.pow(s1 / s0, t) // exponential: zoom feels linear
  // The focus point starts where it sits in the centred mark and glides to screen centre.
  const fx = FOCUS.x + FOCUS.w / 2
  const fy = FOCUS.y + FOCUS.h / 2
  const px = vp.w / 2 + (fx - (BOX.x + BOX.w / 2)) * s0 * (1 - t)
  const py = vp.h / 2 + (fy - (BOX.y + BOX.h / 2)) * s0 * (1 - t)
  const transform = `translate(${px} ${py}) scale(${s}) translate(${-fx} ${-fy})`

  return (
    <div ref={ref} className="relative" style={{ height: reduced ? '100dvh' : '260vh' }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        {video ? (
          <video src={video} poster={poster} autoPlay muted loop playsInline className="absolute inset-0 size-full object-cover" />
        ) : poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-ink" />
        )}
        {!open && (
          <svg aria-hidden className="absolute inset-0 size-full" viewBox={`0 0 ${vp.w} ${vp.h}`} preserveAspectRatio="none">
            <defs>
              <mask id="quote-window" maskUnits="userSpaceOnUse" x={0} y={0} width={vp.w} height={vp.h}>
                <rect width={vp.w} height={vp.h} fill="white" />
                <g transform={transform} fill="black">
                  <path d={LEFT_PATH} />
                  <path d={RIGHT_PATH} />
                </g>
              </mask>
            </defs>
            <rect width={vp.w} height={vp.h} mask="url(#quote-window)" style={{ fill: 'var(--bg)' }} />
          </svg>
        )}
      </div>
    </div>
  )
}
