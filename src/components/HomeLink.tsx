'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/** The logo's link home. On the home page itself it goes back to the top (there is nowhere else to go). */
export function HomeLink({ href, className, label, children }: { href: string; className?: string; label: string; children: ReactNode }) {
  // INCH” pages are rewritten to /inch/… internally (src/proxy.ts); compare public paths.
  const path = usePathname().replace(/^\/inch(?=\/|$)/, '') || '/'
  return (
    <Link
      href={href}
      aria-label={label}
      className={className}
      onClick={(e) => {
        if (path !== href) return
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      }}
    >
      {children}
    </Link>
  )
}
