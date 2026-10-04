import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DivisionTheme } from '@/components/brand/DivisionTheme'
import { Logo } from '@/components/brand/Logo'
import { DotIndexCarousel } from '@/components/motion/DotIndexCarousel'
import { DotStatement } from '@/components/motion/DotStatement'
import { TapeCarousel } from '@/components/motion/TapeCarousel'
import { TalentGrid } from '@/components/TalentCard'
import { DEFAULT_DOT_STATEMENT } from '@/lib/copy'
import { talentSlides } from '@/lib/slides'
import { DIVISION_META, isDivision } from '@/lib/divisions'
import { sanityFetch } from '@/sanity/lib/client'
import { CATEGORIES_BY_DIVISION_QUERY, HOME_QUERY, TALENTS_BY_DIVISION_QUERY } from '@/sanity/lib/queries'
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

  const [categories, talents, home] = await Promise.all([
    sanityFetch<Category[]>(CATEGORIES_BY_DIVISION_QUERY, { division }, [], ['category']),
    sanityFetch<TalentCard[]>(TALENTS_BY_DIVISION_QUERY, { division }, [], ['talent']),
    sanityFetch<{ dotStatement?: string } | null>(HOME_QUERY, {}, null, ['homePage']),
  ])
  const slides = talentSlides(talents.slice(0, 12))
  const isDot = division === 'men'

  return (
    <>
    <DivisionTheme division={division} />
    {isDot && <DotStatement text={home?.dotStatement || DEFAULT_DOT_STATEMENT} />}
    {slides.length > 0 && (isDot ? <DotIndexCarousel slides={slides} height="90dvh" /> : <TapeCarousel slides={slides} height="92dvh" />)}
    <div className="px-5 py-10 md:px-10">
      <header className="mb-10 flex flex-col gap-6">
        <h1 className="flex items-end gap-4">
          <Logo division={division} className="text-7xl md:text-9xl" />
          <span className="label pb-2 text-muted">{meta.label}</span>
        </h1>
        {!!categories.length && (
          <nav className="label flex flex-wrap gap-6">
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
    </>
  )
}
