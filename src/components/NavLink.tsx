'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/** Menu link: marks the current page (aria-current), which the .nav-item tracking keys off. */
export function NavLink({ href, className = '', children }: { href: string; className?: string; children: ReactNode }) {
  // INCH” pages are rewritten to /inch/… internally (src/proxy.ts); compare public paths.
  const path = usePathname().replace(/^\/inch(?=\/|$)/, '') || '/'
  const current = path === href || path.startsWith(`${href}/`)
  return (
    <Link href={href} aria-current={current ? 'page' : undefined} className={`nav-item ${className}`}>
      {children}
    </Link>
  )
}
