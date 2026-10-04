'use client'

/**
 * DOT. — word-step statement.
 * Counterpart to INCH”'s "Text open": instead of a quote mark gliding through a
 * soft character fade, a ■ cursor *jumps* word by word (hard cuts), and at the
 * end it lands as the full stop. Scroll-driven.
 */
import { useLayoutEffect, useRef } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useScrollProgress } from '@/hooks/useScrollProgress'

const ANIM_END = 0.8

export function DotStatement({ text }: { text: string }) {
  const reduced = useReducedMotion()
  const { ref: zoneRef, progress } = useScrollProgress<HTMLDivElement>()
  const words = text.replace(/\.\s*$/, '').split(/\s+/)
  const p = reduced ? 1 : Math.min(1, progress / ANIM_END)
  const shown = p >= 1 ? words.length : Math.max(1, Math.ceil(p * words.length))

  const wrapRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const dot = dotRef.current
    if (!wrap || !dot) return
    const wr = wrap.getBoundingClientRect()
    const last = shown > 0 ? wordRefs.current[shown - 1] : null
    const size = dot.offsetWidth
    if (!last) {
      dot.style.transform = `translate(0px, 0px)`
      return
    }
    const r = last.getBoundingClientRect()
    // sit on the baseline right after the word, like a full stop
    const x = r.right - wr.left + size * 0.35
    const y = r.top - wr.top + r.height * 0.78 - size
    dot.style.transform = `translate(${x}px, ${y}px)`
  })

  const done = shown >= words.length

  return (
    <div ref={zoneRef} style={{ height: reduced ? 'auto' : '180vh' }} className="relative">
      <div className={`${reduced ? 'py-32' : 'sticky top-0 h-dvh'} flex items-center px-5 md:px-10`}>
        <div ref={wrapRef} className="relative w-full max-w-[1400px]">
          <p className="m-0 font-bold uppercase leading-[0.95] tracking-tight" style={{ fontSize: 'clamp(2.5rem, 7vw, 7.5rem)', fontStretch: '80%' }} aria-label={text}>
            {words.map((w, i) => (
              <span key={i} aria-hidden>
                <span ref={(el) => { wordRefs.current[i] = el }} style={{ visibility: i < shown ? 'visible' : 'hidden' }}>
                  {w}
                </span>{' '}
              </span>
            ))}
          </p>
          <span
            ref={dotRef}
            aria-hidden
            className="absolute left-0 top-0 block bg-fg"
            style={{
              width: 'clamp(0.6rem, 1.6vw, 1.7rem)',
              aspectRatio: '1',
              animation: done ? 'none' : 'dot-cursor 0.9s steps(1) infinite',
            }}
          />
        </div>
      </div>
    </div>
  )
}
