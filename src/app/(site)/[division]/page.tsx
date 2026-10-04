import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TalentGrid } from '@/components/TalentCard'
import { DIVISION_META, isDivision } from '@/lib/divisions'
import { sanityFetch } from '@/sanity/lib/client'
import { CATEGORIES_BY_DIVISION_QUERY, TALENTS_BY_DIVISION_QUERY } from '@/sanity/lib/queries'
import type { Category, TalentCard } from '@/sanity/lib/types'

export const dynamicParams = false
export const generateStaticParams = () => [{ division: 'women' }, { division: 'men' }]

export async function generateMetadata({ params }: PageProps<'/[division]'>): Promise<Metadata> {
  const { division } = await params
  if (!isDivision(division)) return {}
  const m = DIVISION_META[division]
  return { title: `${m.brand} ${m.label}`, alternates: { canonical: m.path } }
}

export default async function DivisionPage({ params }: PageProps<'/[division]'>) {
  const { division } = await params
  if (!isDivision(division)) notFound()
  const meta = DIVISION_META[division]

  const [categories, talents] = await Promise.all([
    sanityFetch<Category[]>(CATEGORIES_BY_DIVISION_QUERY, { division }, [], ['category']),
    sanityFetch<TalentCard[]>(TALENTS_BY_DIVISION_QUERY, { division }, [], ['talent']),
  ])

  return (
    <div className="px-5 py-10 md:px-10">
      <header className="mb-10 flex flex-col gap-6">
        <h1 className="text-6xl font-bold tracking-tight md:text-8xl">{meta.brand} {meta.label}</h1>
        {!!categories.length && (
          <nav className="flex flex-wrap gap-4 text-sm uppercase tracking-wide">
            <span className="border-b border-fg">All</span>
            {categories.map((c) => (
              <Link key={c._id} href={`${meta.path}/${c.slug}`} className="text-muted hover:text-fg">
                {c.title}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <TalentGrid talents={talents} />
    </div>
  )
}
