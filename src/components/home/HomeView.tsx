import { QuoteVideoHero, type HeroMedia } from '@/components/motion/QuoteVideoHero'
import { TextOpen } from '@/components/motion/TextOpen'
import { StoryMagazine, type Chapter } from './HomeSections'
import { DEFAULT_DOT_STATEMENT, DEFAULT_STATEMENT } from '@/lib/copy'
import { withPlaceholders } from '@/lib/placeholders'
import { singletonId, SITES, type Site } from '@/lib/sites'
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
 * The home page for a site. `hero` picks how INCH”'s ” opens into the video: it grows with the
 * video inside it (the live home, first tried on /logotest) or it splits (the earlier opening).
 */
export async function HomeView({ site, hero = 'grow' }: { site: Site; hero?: 'split' | 'grow' }) {
  const { division } = SITES[site]
  const [home, talents] = await Promise.all([
    sanityFetch<Home>(HOME_QUERY, { id: singletonId('homePage', site) }, null, ['homePage']),
    sanityFetch<TalentCard[]>(TALENTS_BY_DIVISION_QUERY, { division }, [], ['talent']),
  ])
  const featured = home?.featured?.filter((t) => t?.division === division) ?? []
  const models = featured.length ? featured : talents
  const isDot = site === 'dot'

  const posterUrl = (img?: SanityImage) => (img?.asset ? urlFor(img).width(2000).url() : undefined)
  const heroMedia = (h: Home) => {
    const list = (h?.heroVideos ?? []).flatMap<HeroMedia>((m) =>
      m?._type === 'heroImage'
        ? m.asset ? [{ kind: 'image', src: urlFor(m).width(2400).url() }] : []
        : m?.src ? [{ kind: 'video', src: m.src, poster: posterUrl(m.poster) }] : [],
    )
    if (!list.length && h?.heroVideo) list.push({ kind: 'video', src: h.heroVideo, poster: posterUrl(h.heroPoster) })
    return list
  }
  let videos = heroMedia(home)
  // DOT. without videos of its own yet: INCH”'s, until DOT.'s Home page has some.
  // TODO: DOT.'s own hero videos in the Studio (DOT. › Home page › Hero videos & images).
  if (isDot && !videos.length) videos = heroMedia(await sanityFetch<Home>(HOME_QUERY, { id: singletonId('homePage', 'inch') }, null, ['homePage']))

  // Both sites alike: the mark (INCH”'s ”, DOT.'s ■) opens to the full-screen video → the statement
  // on scroll → the magazine.
  return (
    <>
      <QuoteVideoHero videos={videos} opening={hero} division={division} />
      <TextOpen text={home?.statement || (isDot ? DEFAULT_DOT_STATEMENT : DEFAULT_STATEMENT)} />
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
