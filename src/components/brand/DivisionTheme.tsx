'use client'

import { useEffect } from 'react'
import type { Division } from '@/sanity/lib/types'

/** Inverts the whole page (header included) on DOT. routes. */
export function DivisionTheme({ division }: { division: Division }) {
  useEffect(() => {
    const el = document.documentElement
    if (division === 'men') el.dataset.theme = 'dot'
    else delete el.dataset.theme
    return () => {
      delete el.dataset.theme
    }
  }, [division])
  return null
}
