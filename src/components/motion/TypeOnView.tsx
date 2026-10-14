'use client'

/**
 * Holds the TypeText inside it until it scrolls into view, then lets it type (once).
 */
import { useEffect, useRef, useState } from 'react'

export function TypeOnView({ as: Tag = 'div', className, children }: { as?: 'div' | 'li' | 'p'; className?: string; children: React.ReactNode }) {
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
      { rootMargin: '0px 0px -25% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag ref={ref as React.Ref<never>} data-type-wait={seen ? undefined : ''} className={className}>
      {children}
    </Tag>
  )
}
