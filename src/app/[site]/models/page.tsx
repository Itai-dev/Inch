import type { Metadata } from 'next'
import { CategoryNav } from '@/components/CategoryNav'
import { TalentGrid } from '@/components/TalentCard'
import { withPlaceholders } from '@/lib/placeholders'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { CATEGORIES_BY_DIVISION_QUERY, TALENTS_BY_DIVISION_QUERY } from '@/sanity/lib/queries'
import type { Category, TalentCard } from '@/sanity/lib/types'

export async function generateMetadata({ params }: PageProps<'/[site]/models'>): Promise<Metadata> {
  const site = (await params).site as Site
  return { title: 'Models', alternates: { canonical: sitePath(site, '/models') } }
}

export default async function ModelsPage({ params }: PageProps<'/[site]/models'>) {
  const site = (await params).site as Site
  const { division, label, brand } = SITES[site]
  const [categories, talents] = await Promise.all([
    sanityFetch<Category[]>(CATEGORIES_BY_DIVISION_QUERY, { division }, [], ['category']),
    sanityFetch<TalentCard[]>(TALENTS_BY_DIVISION_QUERY, { division }, [], ['talent']),
  ])

  return (
    <div className="pb-10 pt-6 md:pt-10">
      <header className="mb-6 flex flex-col items-center gap-4 px-gutter">
        <h1 className="sr-only">{brand} — {label}</h1>
        <CategoryNav site={site} categories={categories} />
      </header>
      <TalentGrid talents={withPlaceholders(talents, division)} />
    </div>
  )
}
