'use client'

/**
 * DOT. — square aperture open.
 * Counterpart to INCH”'s "Blink and open": no blink — a ■ pulses twice, then
 * becomes a square aperture that snaps open to the full image (expo in-out).
 * Pure CSS keyframes; plays when it enters the viewport.
 */
import { useEffect, useRef, useState } from 'react'

export function DotOpen({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setPlay(true)
        io.disconnect()
      }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const state = play ? 'running' : 'paused'
  return (
    <div ref={ref} className={`relative aspect-[3/4] overflow-hidden ${className}`} style={{ ['--dot' as string]: '9px' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="block size-full object-cover"
        style={{ animation: 'dot-aperture 0.9s cubic-bezier(0.87, 0, 0.13, 1) 1.1s both', animationPlayState: state }}
      />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 -ml-[9px] -mt-[9px] block size-[18px] bg-fg"
        style={{
          animation: 'dot-pulse 1.1s steps(6) both, dot-fade-out 0.3s ease-in 1.3s both',
          animationPlayState: `${state}, ${state}`,
        }}
      />
    </div>
  )
}
