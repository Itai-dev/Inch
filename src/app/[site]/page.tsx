import Link from 'next/link'
import { DotIndexCarousel } from '@/components/motion/DotIndexCarousel'
import { DotStatement } from '@/components/motion/DotStatement'
import { TapeCarousel } from '@/components/motion/TapeCarousel'
import { TextOpen } from '@/components/motion/TextOpen'
import { TalentGrid } from '@/components/TalentCard'
import { DEFAULT_DOT_STATEMENT, DEFAULT_STATEMENT } from '@/lib/copy'
import { singletonId, sitePath, SITES, type Site } from '@/lib/sites'
import { talentSlides } from '@/lib/slides'
import { sanityFetch } from '@/sanity/lib/client'
import { HOME_QUERY, TALENTS_BY_DIVISION_QUERY } from '@/sanity/lib/queries'
import type { TalentCard } from '@/sanity/lib/types'

type Home = { statement?: string; featured?: TalentCard[] } | null

export default async function HomePage({ params }: PageProps<'/[site]'>) {
  const site = (await params).site as Site
  const { division } = SITES[site]
  const [home, talents] = await Promise.all([
    sanityFetch<Home>(HOME_QUERY, { id: singletonId('homePage', site) }, null, ['homePage']),
    sanityFetch<TalentCard[]>(TALENTS_BY_DIVISION_QUERY, { division }, [], ['talent']),
  ])
  const featured = home?.featured?.filter((t) => t?.division === division) ?? []
  const slides = talentSlides(featured.length ? featured : talents.slice(0, 12))
  const isDot = site === 'dot'

  return (
    <>
      {isDot ? (
        <DotStatement text={home?.statement || DEFAULT_DOT_STATEMENT} />
      ) : (
        <TextOpen text={home?.statement || DEFAULT_STATEMENT} />
      )}

      {slides.length > 0 &&
        (isDot ? <DotIndexCarousel slides={slides} height="90dvh" /> : <TapeCarousel slides={slides} height="92dvh" />)}

      <section className="px-5 py-16 md:px-10">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="label text-muted">Models</h2>
          <Link href={sitePath(site, '/models')} className="label">All models →</Link>
        </div>
        <TalentGrid talents={talents} />
      </section>
    </>
  )
}
