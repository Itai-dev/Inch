'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

/** sessionStorage key: the INCH” hero skips its loader and starts at the video reveal. */
export const SKIP_HERO_LOADER = 'inch:skip-hero-loader'

/** Link to the other site. Going back to INCH” from DOT. skips the hero's blinking loader. */
export function SiteSwitchLink({ href, toInch, className, label, children }: { href: string; toInch: boolean; className?: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={className}
      onClick={() => {
        if (!toInch) return
        try {
          sessionStorage.setItem(SKIP_HERO_LOADER, '1')
        } catch {}
      }}
    >
      {children}
    </Link>
  )
}
