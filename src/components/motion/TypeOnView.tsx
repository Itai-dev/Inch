'use client'

/**
 * Holds the TypeText inside it until it scrolls into view, then lets it type (once).
 */
import { useEffect, useRef, useState } from 'react'

/** `margin`: how far up from the bottom of the screen it must come first (default a quarter of it). */
export function TypeOnView({ as: Tag = 'div', className, margin = '-25%', children }: { as?: 'div' | 'li' | 'p'; className?: string; margin?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setSeen(true)
        io.disconnect()
      },
      { rootMargin: `0px 0px ${margin} 0px` },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin])

  return (
    <Tag ref={ref as React.Ref<never>} data-type-wait={seen ? undefined : ''} className={className}>
      {children}
    </Tag>
  )
}
