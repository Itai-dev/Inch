import { isPlaceholder } from '@/lib/placeholders'
import { creditLine } from '@/lib/slides'
import { SITES, type Site } from '@/lib/sites'
import { DEFAULT_STORY } from '@/lib/copy'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, TalentCard as TalentCardType } from '@/sanity/lib/types'
import { Magazine, type Pic, type Spread } from './Magazine'

/**
 * The home page below the statement: the agency's story as a magazine you leaf through.
 */

export type Chapter = { _key?: string; heading: string; text: string; images?: SanityImage[] | null }

const fromSanity = (img: SanityImage): Pic => ({ src: urlFor(img).width(1400).url(), alt: img.alt || '', credit: creditLine(img) || undefined })
const fromTalent = (t: TalentCardType): Pic | null =>
  t.cover?.asset ? { src: urlFor(t.cover).width(1400).url(), alt: t.name } : t.coverSrc ? { src: t.coverSrc, alt: '' } : null

/** The chapter told as the magazine: the first. */
const MAGAZINE_AT = 0
const SPREADS = 5

type StoryProps = { site: Site; chapters?: Chapter[] | null; talents: TalentCardType[] }

/** The story's chapters, and the magazine's spreads and cover. */
function storyParts({ chapters, talents }: StoryProps) {
  const story: Chapter[] = chapters?.length ? chapters : DEFAULT_STORY
  const board = [...talents.filter((t) => !isPlaceholder(t)), ...talents.filter(isPlaceholder)]
  const covers = board.map(fromTalent).filter((p): p is Pic => !!p)
  // The magazine: the chapter's own pictures (named by their alt text), else the board, a model a spread.
  const ownSpreads: Spread[] = (story[MAGAZINE_AT]?.images ?? []).filter((i) => i?.asset).map((i) => ({ name: i.alt || '', pic: fromSanity(i) }))
  const spreads: Spread[] =
    ownSpreads.length >= 2
      ? ownSpreads
      : board.flatMap((t) => {
          const pic = fromTalent(t)
          return pic ? [{ name: t.name, pic: { ...pic, alt: t.name } }] : []
        }).slice(0, SPREADS)
  // The cover: the chapter's own first picture, else the board's first (real ones come first).
  const cover = ownSpreads[0]?.pic ?? covers[0] ?? spreads[0]?.pic
  return { story, spreads, cover, hasMagazine: !!story[MAGAZINE_AT] && spreads.length > 1 }
}

/** The story's first chapter as a magazine, right after the statement. */
export function StoryMagazine(props: StoryProps) {
  const { brand, division } = SITES[props.site]
  const { story, spreads, cover, hasMagazine } = storyParts(props)
  if (!hasMagazine || !cover) return null
  const c = story[MAGAZINE_AT]
  return <Magazine number={MAGAZINE_AT + 1} heading={c.heading} text={c.text} brand={brand} division={division} cover={cover} spreads={spreads} />
}
