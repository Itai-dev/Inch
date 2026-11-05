'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Remembers whether this tab has seen a page other than the full-screen sheets (a model page,
 * the application), so their close button can step back to it (keeping the board's scroll
 * position) instead of reloading it; opened straight from a link, close goes to the home page.
 * Module memory: survives in-site navigation, not a reload.
 */
let cameFromSite = false
export const hasSitePageBehind = () => cameFromSite

export function RouteMemory() {
  const path = usePathname()
  useEffect(() => {
    if (!/\/(talent\/|apply(\/|$))/.test(path)) cameFromSite = true
  }, [path])
  return null
}
