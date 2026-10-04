import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { QuoteMark, SquareDot } from '@/components/brand/Marks'
import { TapeCarousel } from '@/components/motion/TapeCarousel'
import { TextOpen } from '@/components/motion/TextOpen'
import { DEFAULT_STATEMENT } from '@/lib/copy'
import { talentSlides } from '@/lib/slides'
import { sanityFetch } from '@/sanity/lib/client'
import { HOME_QUERY } from '@/sanity/lib/queries'
import type { TalentCard } from '@/sanity/lib/types'

type Home = { statement?: string; featured?: TalentCard[] } | null

export default async function HomePage() {
  const home = await sanityFetch<Home>(HOME_QUERY, {}, null, ['homePage'])
  const featured = talentSlides(home?.featured ?? [])

  return (
    <>
      <TextOpen text={home?.statement || DEFAULT_STATEMENT} />

      <section className="grid grid-cols-1 md:grid-cols-2">
        <Link href="/women" className="group flex aspect-[4/3] flex-col justify-between bg-paper p-8 text-ink md:p-12">
          <QuoteMark height={40} />
          <div className="flex items-end justify-between">
            <Logo className="text-[18vw] md:text-[9vw]" />
            <span className="label">Women →</span>
          </div>
        </Link>
        <Link href="/men" className="group flex aspect-[4/3] flex-col justify-between bg-ink p-8 text-paper md:p-12">
          <SquareDot size={28} />
          <div className="flex items-end justify-between">
            <Logo division="men" className="text-[18vw] md:text-[9vw]" />
            <span className="label">Men →</span>
          </div>
        </Link>
      </section>

      {featured.length > 0 && (
        <section className="pt-16">
          <h2 className="label px-5 text-muted md:px-10">Featured</h2>
          <TapeCarousel slides={featured} height="92dvh" />
        </section>
      )}
    </>
  )
}
