import type { Metadata } from 'next'
import { singletonId, sitePath, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { SiteSettings } from '@/sanity/lib/types'

export async function generateMetadata({ params }: PageProps<'/[site]/contact'>): Promise<Metadata> {
  const site = (await params).site as Site
  return { title: 'Contact', alternates: { canonical: sitePath(site, '/contact') } }
}

export default async function ContactPage({ params }: PageProps<'/[site]/contact'>) {
  const site = (await params).site as Site
  const s = await sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, { id: singletonId('siteSettings', site) }, null, ['siteSettings'])
  const rows: [string, React.ReactNode][] = [
    ['Email', s?.email && <a href={`mailto:${s.email}`}>{s.email}</a>],
    ['Phone', s?.phone && <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a>],
    ['Address', s?.address && <span className="whitespace-pre-line">{s.address}</span>],
    ['Instagram', s?.instagram && <a href={s.instagram} target="_blank" rel="noreferrer">{s.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}</a>],
  ]
  const filled = rows.filter(([, v]) => v)

  return (
    <div className="grid gap-12 px-gutter py-16 md:grid-cols-2">
      <h1 className="text-6xl font-bold tracking-tight">Contact</h1>
      <div className="flex flex-col gap-8 text-lg">
        {filled.length ? (
          filled.map(([k, v]) => (
            <section key={k}><h2 className="text-sm uppercase text-muted">{k}</h2><p>{v}</p></section>
          ))
        ) : (
          <p className="text-muted">Add contact details in the Studio → Site settings.</p>
        )}
      </div>
    </div>
  )
}
