import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CategoryNav } from '@/components/CategoryNav'
import { TalentGrid } from '@/components/TalentCard'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { CATEGORIES_BY_DIVISION_QUERY, CATEGORY_QUERY } from '@/sanity/lib/queries'
import type { Category, TalentCard } from '@/sanity/lib/types'

type CategoryWithTalents = (Category & { talents: TalentCard[] }) | null

const load = (site: Site, category: string) =>
  sanityFetch<CategoryWithTalents>(CATEGORY_QUERY, { division: SITES[site].division, category }, null, ['category', 'talent'])

export async function generateMetadata({ params }: PageProps<'/[site]/models/[category]'>): Promise<Metadata> {
  const { site, category } = await params
  const data = await load(site as Site, category)
  if (!data) return {}
  return { title: data.title, alternates: { canonical: sitePath(site as Site, `/models/${category}`) } }
}

export default async function CategoryPage({ params }: PageProps<'/[site]/models/[category]'>) {
  const { site: s, category } = await params
  const site = s as Site
  const [data, categories] = await Promise.all([
    load(site, category),
    sanityFetch<Category[]>(CATEGORIES_BY_DIVISION_QUERY, { division: SITES[site].division }, [], ['category']),
  ])
  if (!data) notFound()

  return (
    <div className="px-5 py-10 md:px-10">
      <header className="mb-10 flex flex-col gap-6">
        <h1 className="wordmark text-7xl md:text-9xl">{data.title}</h1>
        <CategoryNav site={site} categories={categories} active={category} />
      </header>
      <TalentGrid talents={data.talents} />
    </div>
  )
}
