'use client'

/**
 * INCH” — "Blink mark and open image" (from Figma Make prototype).
 * The ” blinks 3×, then the strokes slide apart while the image clips open
 * from the centre. Plays once when it enters the viewport.
 */
import { useEffect, useRef, useState } from 'react'
import { QuoteStroke } from '@/components/brand/Marks'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const TOTAL_MS = 3600
const BLINK_END = 1200 / TOTAL_MS
const BLINK_N = 3
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)

export function BlinkOpen({ src, alt, markHeight = 56, className = '' }: { src: string; alt: string; markHeight?: number; className?: string }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (now: number) => {
        const v = Math.min(1, (now - t0) / TOTAL_MS)
        setP(v)
        if (v < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [reduced])

  const progress = reduced ? 1 : p
  const blinkNorm = Math.min(progress / BLINK_END, 1)
  const markOpacity = progress < BLINK_END ? 0.25 + 0.75 * ((Math.cos(blinkNorm * BLINK_N * 2 * Math.PI) + 1) / 2) : 1
  const reveal = easeOutQuint(progress <= BLINK_END ? 0 : (progress - BLINK_END) / (1 - BLINK_END))
  const markW = Math.round(markHeight * (256 / 611))
  const gap = Math.round(markHeight * 0.27)

  return (
    <div ref={ref} className={`relative flex items-center ${className}`} style={{ gap, containerType: 'inline-size' }}>
      {/* Marks travel from the centre to the image edges */}
      <div
        className="relative z-10 shrink-0"
        style={{ transform: `translateX(calc(${(1 - reveal)} * (50cqw - ${markW + gap / 2}px)))`, opacity: markOpacity }}
      >
        <QuoteStroke side="left" height={markHeight} />
      </div>
      <div className="relative aspect-[3/4] min-w-0 flex-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="block size-full object-cover"
          style={{ clipPath: `inset(0 ${(1 - reveal) * 50}%)`, opacity: reveal }}
        />
      </div>
      <div
        className="relative z-10 shrink-0"
        style={{ transform: `translateX(calc(${(1 - reveal)} * -1 * (50cqw - ${markW + gap / 2}px)))`, opacity: markOpacity }}
      >
        <QuoteStroke side="right" height={markHeight} />
      </div>
    </div>
  )
}
