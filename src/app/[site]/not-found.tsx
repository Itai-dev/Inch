'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NotFound() {
  const home = usePathname()?.startsWith('/dot') ? '/dot' : '/'
  return (
    <div className="flex min-h-[60dvh] flex-col items-start justify-center gap-6 px-gutter">
      <p className="label text-muted">404</p>
      <h1 className="wordmark text-7xl md:text-9xl">Not found</h1>
      <Link href={home} className="label underline">Back to home</Link>
    </div>
  )
}
