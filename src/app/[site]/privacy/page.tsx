import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy' }

// TODO: final legal copy from INCH”.
export default function Page() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="mb-8 text-5xl font-bold tracking-tight">Privacy</h1>
      <p className="text-muted">Content coming soon.</p>
    </article>
  )
}
