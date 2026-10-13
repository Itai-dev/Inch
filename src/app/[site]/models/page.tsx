import type { Metadata } from 'next'
import { Logo } from '@/components/brand/Logo'
import { CategoryNav } from '@/components/CategoryNav'
import { TalentGrid } from '@/components/TalentCard'
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
  const { division, label } = SITES[site]
  const [categories, talents] = await Promise.all([
    sanityFetch<Category[]>(CATEGORIES_BY_DIVISION_QUERY, { division }, [], ['category']),
    sanityFetch<TalentCard[]>(TALENTS_BY_DIVISION_QUERY, { division }, [], ['talent']),
  ])

  return (
    <div className="px-gutter py-10">
      <header className="mb-10 flex flex-col gap-6">
        <h1 className="flex items-end gap-4">
          <Logo division={division} className="text-7xl md:text-9xl" />
          <span className="label pb-2 text-muted">{label}</span>
        </h1>
        <CategoryNav site={site} categories={categories} />
      </header>
      <TalentGrid talents={talents} />
    </div>
  )
}
