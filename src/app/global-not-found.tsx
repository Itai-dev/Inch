import type { Metadata } from 'next'
import Link from 'next/link'
import '@fontsource-variable/archivo/wdth.css'
import './globals.css'

export const metadata: Metadata = { title: 'Page not found — INCH”' }

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="flex min-h-dvh flex-col items-start justify-center gap-6 px-gutter">
          <p className="label text-muted">404</p>
          <h1 className="wordmark text-7xl md:text-9xl">Not found</h1>
          <Link href="/" className="label underline">Back to INCH”</Link>
        </main>
      </body>
    </html>
  )
}
