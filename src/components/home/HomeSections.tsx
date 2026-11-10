import { isPlaceholder } from '@/lib/placeholders'
import { creditLine } from '@/lib/slides'
import { SITES, type Site } from '@/lib/sites'
import { DEFAULT_MAGAZINE } from '@/lib/copy'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, TalentCard as TalentCardType } from '@/sanity/lib/types'
import { Magazine, type Pic, type Spread } from './Magazine'

/**
 * The home page below the statement: a magazine you leaf through, set in the Studio
 * (Home page › Magazine): its title and first page of text, its cover and its pages.
 */

/** A page is a model (her cover picture and name) or a picture with its own caption: both arrive as a name and an image. */
export type MagazineContent = {
  heading?: string
  text?: string
  cover?: SanityImage
  pages?: ({ _key?: string; name?: string; image?: SanityImage } | null)[] | null
} | null

const fromSanity = (img: SanityImage, alt = ''): Pic => ({ src: urlFor(img).width(1400).url(), alt: img.alt || alt, credit: creditLine(img) || undefined })
const fromTalent = (t: TalentCardType): Pic | null =>
  t.cover?.asset ? { src: urlFor(t.cover).width(1400).url(), alt: t.name } : t.coverSrc ? { src: t.coverSrc, alt: '' } : null

/** Without pages of its own, the magazine shows this many models from the board. */
const SPREADS = 5

export function HomeMagazine({ site, magazine, talents }: { site: Site; magazine?: MagazineContent; talents: TalentCardType[] }) {
  const { brand, division } = SITES[site]
  // The Studio's pages (two or more), else the board, a model a spread (real ones first).
  const own: Spread[] = (magazine?.pages ?? []).flatMap((p) => (p?.image?.asset ? [{ name: p.name || '', pic: fromSanity(p.image, p.name) }] : []))
  const board = [...talents.filter((t) => !isPlaceholder(t)), ...talents.filter(isPlaceholder)]
  const spreads: Spread[] =
    own.length >= 2
      ? own
      : board.flatMap((t) => {
          const pic = fromTalent(t)
          return pic ? [{ name: t.name, pic: { ...pic, alt: t.name } }] : []
        }).slice(0, SPREADS)
  // The cover: the Studio's, else the first page's picture.
  const cover = magazine?.cover?.asset ? fromSanity(magazine.cover) : spreads[0]?.pic
  if (spreads.length < 2 || !cover) return null
  return (
    <Magazine
      number={1}
      heading={magazine?.heading?.trim() || DEFAULT_MAGAZINE.heading}
      text={magazine?.text?.trim() || DEFAULT_MAGAZINE.text}
      brand={brand}
      division={division}
      cover={cover}
      spreads={spreads}
    />
  )
}
