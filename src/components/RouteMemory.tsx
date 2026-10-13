'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Remembers whether this tab has seen a page other than a model page, so the model
 * sheet's close button can step back to it (keeping the board's scroll position)
 * instead of reloading the board. Module memory: survives in-site navigation, not a reload.
 */
let cameFromSite = false
export const hasSitePageBehind = () => cameFromSite

export function RouteMemory() {
  const path = usePathname()
  useEffect(() => {
    if (!path.includes('/talent/')) cameFromSite = true
  }, [path])
  return null
}
