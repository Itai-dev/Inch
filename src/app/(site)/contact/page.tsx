import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contact', alternates: { canonical: '/contact' } }

// TODO: pull email / phone / address from Site settings in Sanity.
export default function ContactPage() {
  return (
    <div className="grid gap-12 px-5 py-16 md:grid-cols-2 md:px-10">
      <h1 className="text-6xl font-bold tracking-tight">Contact</h1>
      <div className="flex flex-col gap-8 text-lg">
        <section><h2 className="text-sm uppercase text-muted">Bookings</h2><p>bookings@inch.example</p></section>
        <section><h2 className="text-sm uppercase text-muted">Scouting</h2><p>scouting@inch.example</p></section>
        <section><h2 className="text-sm uppercase text-muted">Address</h2><p>Tel Aviv</p></section>
      </div>
    </div>
  )
}
