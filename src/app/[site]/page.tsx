import Link from 'next/link'
import { IntroSection } from '@/components/IntroSection'
import { DotIndexCarousel } from '@/components/motion/DotIndexCarousel'
import { DotStatement } from '@/components/motion/DotStatement'
import { QuoteVideoHero, type HeroMedia } from '@/components/motion/QuoteVideoHero'
import { TextOpen } from '@/components/motion/TextOpen'
import { TalentGrid } from '@/components/TalentCard'
import { DEFAULT_DOT_STATEMENT, DEFAULT_STATEMENT } from '@/lib/copy'
import { singletonId, sitePath, SITES, type Site } from '@/lib/sites'
import { talentSlides } from '@/lib/slides'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { HOME_QUERY, TALENTS_BY_DIVISION_QUERY } from '@/sanity/lib/queries'
import type { SanityImage, TalentCard } from '@/sanity/lib/types'

type Home = {
  heroVideos?: ({ _type: 'heroVideo'; src?: string; poster?: SanityImage } | ({ _type: 'heroImage' } & SanityImage))[] | null
  heroVideo?: string
  heroPoster?: SanityImage
  statement?: string
  intro?: string
  introImages?: SanityImage[]
  featured?: TalentCard[]
} | null

export default async function HomePage({ params }: PageProps<'/[site]'>) {
  const site = (await params).site as Site
  const { division } = SITES[site]
  const [home, talents] = await Promise.all([
    sanityFetch<Home>(HOME_QUERY, { id: singletonId('homePage', site) }, null, ['homePage']),
    sanityFetch<TalentCard[]>(TALENTS_BY_DIVISION_QUERY, { division }, [], ['talent']),
  ])
  const featured = home?.featured?.filter((t) => t?.division === division) ?? []
  const models = featured.length ? featured : talents
  const isDot = site === 'dot'

  if (isDot) {
    const slides = talentSlides(featured.length ? featured : talents.slice(0, 12))
    return (
      <>
        <DotStatement text={home?.statement || DEFAULT_DOT_STATEMENT} />
        {slides.length > 0 && <DotIndexCarousel slides={slides} height="90dvh" />}
        <IntroSection text={home?.intro} images={home?.introImages} />
        <ModelsSection site={site} talents={talents} />
      </>
    )
  }

  // INCH”: ” opens to full-screen video → statement on scroll → paragraph + images → models.
  const posterUrl = (img?: SanityImage) => (img?.asset ? urlFor(img).width(2000).url() : undefined)
  const videos = (home?.heroVideos ?? []).flatMap<HeroMedia>((m) =>
    m?._type === 'heroImage'
      ? m.asset ? [{ kind: 'image', src: urlFor(m).width(2400).url() }] : []
      : m?.src ? [{ kind: 'video', src: m.src, poster: posterUrl(m.poster) }] : [],
  )
  if (!videos.length && home?.heroVideo) videos.push({ kind: 'video', src: home.heroVideo, poster: posterUrl(home.heroPoster) })
  return (
    <>
      <QuoteVideoHero videos={videos} />
      <TextOpen text={home?.statement || DEFAULT_STATEMENT} />
      <IntroSection text={home?.intro} images={home?.introImages} />
      <ModelsSection site={site} talents={models} />
    </>
  )
}

function ModelsSection({ site, talents }: { site: Site; talents: TalentCard[] }) {
  return (
    <section className="px-gutter py-16">
      <div className="mb-10 flex items-end justify-between">
        <h2 className="label text-muted">Models</h2>
        <Link href={sitePath(site, '/models')} className="label">All models →</Link>
      </div>
      <TalentGrid talents={talents} />
    </section>
  )
}
