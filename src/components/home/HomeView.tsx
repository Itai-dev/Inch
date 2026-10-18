import { DotIndexCarousel } from '@/components/motion/DotIndexCarousel'
import { DotStatement } from '@/components/motion/DotStatement'
import { QuoteVideoHero, type HeroMedia } from '@/components/motion/QuoteVideoHero'
import { TextOpen } from '@/components/motion/TextOpen'
import { StoryMagazine, type Chapter } from './HomeSections'
import { DEFAULT_DOT_STATEMENT, DEFAULT_STATEMENT } from '@/lib/copy'
import { withPlaceholders } from '@/lib/placeholders'
import { singletonId, SITES, type Site } from '@/lib/sites'
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
  story?: Chapter[] | null
  featured?: TalentCard[]
} | null

/**
 * The home page for a site. `hero` picks how INCH”'s ” opens into the video: it splits
 * (the live home) or it grows with the video inside it (/logotest, for trying it out).
 */
export async function HomeView({ site, hero = 'split' }: { site: Site; hero?: 'split' | 'grow' }) {
  const { division } = SITES[site]
  const [home, talents] = await Promise.all([
    sanityFetch<Home>(HOME_QUERY, { id: singletonId('homePage', site) }, null, ['homePage']),
    sanityFetch<TalentCard[]>(TALENTS_BY_DIVISION_QUERY, { division }, [], ['talent']),
  ])
  const featured = home?.featured?.filter((t) => t?.division === division) ?? []
  const models = featured.length ? featured : talents
  const isDot = site === 'dot'

  const posterUrl = (img?: SanityImage) => (img?.asset ? urlFor(img).width(2000).url() : undefined)
  const videos = (home?.heroVideos ?? []).flatMap<HeroMedia>((m) =>
    m?._type === 'heroImage'
      ? m.asset ? [{ kind: 'image', src: urlFor(m).width(2400).url() }] : []
      : m?.src ? [{ kind: 'video', src: m.src, poster: posterUrl(m.poster) }] : [],
  )
  if (!videos.length && home?.heroVideo) videos.push({ kind: 'video', src: home.heroVideo, poster: posterUrl(home.heroPoster) })

  if (isDot) {
    const slides = talentSlides(featured.length ? featured : talents.slice(0, 12))
    return (
      <>
        <DotStatement text={home?.statement || DEFAULT_DOT_STATEMENT} />
        {slides.length > 0 && <DotIndexCarousel slides={slides} height="90dvh" />}
        <Story site={site} home={home} talents={withPlaceholders(talents, division)} />
      </>
    )
  }

  // INCH”: ” opens to full-screen video → statement on scroll → the magazine.
  return (
    <>
      <QuoteVideoHero videos={videos} opening={hero} />
      <TextOpen text={home?.statement || DEFAULT_STATEMENT} />
      <Story site={site} home={home} talents={withPlaceholders(models, division)} />
    </>
  )
}

/** Below the opening, on both sites: the magazine. */
function Story({ site, home, talents }: { site: Site; home: Home; talents: TalentCard[] }) {
  return (
    <>
      <StoryMagazine site={site} chapters={home?.story} talents={talents} />
    </>
  )
}
