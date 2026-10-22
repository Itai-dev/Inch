import type { Metadata } from 'next'
import { ApplyFunnel } from '@/components/apply/ApplyFunnel'
import { singletonId, sitePath, SITES, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { SITE_SETTINGS_QUERY, TALENTS_BY_DIVISION_QUERY } from '@/sanity/lib/queries'
import type { SiteSettings, TalentCard } from '@/sanity/lib/types'

export async function generateMetadata({ params }: PageProps<'/[site]/apply'>): Promise<Metadata> {
  const site = (await params).site as Site
  return { title: 'Become a model', description: 'No experience needed. Four phone photos and about three minutes: our scouts look at every application themselves.', alternates: { canonical: sitePath(site, '/apply') } }
}

export default async function ApplyPage({ params }: PageProps<'/[site]/apply'>) {
  const site = (await params).site as Site
  const [talents, settings] = await Promise.all([
    sanityFetch<TalentCard[]>(TALENTS_BY_DIVISION_QUERY, { division: SITES[site].division }, [], ['talent']),
    sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, { id: singletonId('siteSettings', site) }, null, ['siteSettings']),
  ])
  // The opening screen leads with one of the board's own pictures.
  const lead = talents.find((t) => t.cover?.asset)
  const image = lead ? urlFor(lead.cover).width(1200).height(1600).url() : undefined
  return <ApplyFunnel site={site} image={image} scoutingEmail={settings?.email} />
}
