import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DivisionTheme } from '@/components/brand/DivisionTheme'
import { TalentGrid } from '@/components/TalentCard'
import { DIVISION_META, isDivision } from '@/lib/divisions'
import { sanityFetch } from '@/sanity/lib/client'
import { CATEGORY_QUERY } from '@/sanity/lib/queries'
import type { Category, TalentCard } from '@/sanity/lib/types'

type CategoryWithTalents = (Category & { talents: TalentCard[] }) | null

async function load(division: string, category: string) {
  if (!isDivision(division)) return null
  return sanityFetch<CategoryWithTalents>(CATEGORY_QUERY, { division, category }, null, ['category', 'talent'])
}

export async function generateMetadata({ params }: PageProps<'/[division]/[category]'>): Promise<Metadata> {
  const { division, category } = await params
  const data = await load(division, category)
  if (!data || !isDivision(division)) return {}
  return { title: `${data.title} — ${DIVISION_META[division].brand}` }
}

export default async function CategoryPage({ params }: PageProps<'/[division]/[category]'>) {
  const { division, category } = await params
  const data = await load(division, category)
  if (!data || !isDivision(division)) notFound()
  const meta = DIVISION_META[division]

  return (
    <div className="px-5 py-10 md:px-10">
      <DivisionTheme division={division} />
      <Link href={meta.path} className="label text-muted">← {meta.brand} {meta.label}</Link>
      <h1 className="mb-10 mt-4 wordmark text-7xl md:text-9xl">{data.title}</h1>
      <TalentGrid talents={data.talents} />
    </div>
  )
}
