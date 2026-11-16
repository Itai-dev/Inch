import { creditLine } from '@/lib/slides'
import { SITES, type Site } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, TalentCard as TalentCardType } from '@/sanity/lib/types'
import { Magazine, type Face, type Pic, type Spread } from './Magazine'

/**
 * The home page below the statement: the agency's story as a magazine you leaf through.
 */

export type Chapter = { _key?: string; heading: string; text: string; images?: SanityImage[] | null }
/** Studio › Home page › Magazine: the cover, the first page's title and text, then the pages. */
export type MagazineDoc = {
  cover?: SanityImage | null
  heading?: string | null
  text?: string | null
  pages?: ({ _type: 'page'; image?: SanityImage | null; name?: string | null } | { _type: 'spread'; image?: SanityImage | null })[] | null
} | null

const fromSanity = (img: SanityImage): Pic => ({ src: urlFor(img).width(1400).url(), alt: img.alt || '', credit: creditLine(img) || undefined })
const fromTalent = (t: TalentCardType): Pic | null =>
  t.cover?.asset ? { src: urlFor(t.cover).width(1400).url(), alt: t.name } : null

/** The chapter told as the magazine: the first. */
const MAGAZINE_AT = 0
const SPREADS = 5

type StoryProps = { site: Site; chapters?: Chapter[] | null; magazine?: MagazineDoc; talents: TalentCardType[] }

/** The Studio's pages in book order, from the first right page: a spread starts on a left page (a blank page goes before it when it would not). */
function facesOf(pages: NonNullable<MagazineDoc>['pages']): Face[] {
  const faces: Face[] = []
  for (const p of pages ?? []) {
    const pic = p.image?.asset ? fromSanity(p.image) : null
    if (p._type === 'spread') {
      if (!pic) continue
      // faces[0] is a right page, so an even count means the next page is a right one.
      if (faces.length % 2 === 0) faces.push({ kind: 'blank' })
      faces.push({ kind: 'half', pic, side: 'left' }, { kind: 'half', pic, side: 'right' })
    } else if (pic) faces.push({ kind: 'photo', pic })
    else if (p.name?.trim()) faces.push({ kind: 'name', name: p.name.trim() })
  }
  return faces
}

/** The older layout as pages: the first model's photo, then each next one's name facing her photo. */
const facesOfSpreads = (spreads: Spread[]): Face[] =>
  spreads.flatMap((s, k) => (k === 0 ? [{ kind: 'photo', pic: s.pic } as Face] : [{ kind: 'name', name: s.name } as Face, { kind: 'photo', pic: s.pic } as Face]))

/** The story's chapters, and the magazine's spreads and cover. */
function storyParts({ chapters, talents }: StoryProps) {
  const story: Chapter[] = chapters ?? []
  const board = talents
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
  return { story, spreads, cover, hasMagazine: spreads.length > 1 }
}

/** The story's first chapter as a magazine, right after the statement. */
export function StoryMagazine(props: StoryProps) {
  const { brand, division } = SITES[props.site]
  const { story, spreads, cover, hasMagazine } = storyParts(props)
  const c = story[MAGAZINE_AT]
  // The Studio's own magazine, page by page, when it has pages; else the older layout.
  const m = props.magazine
  const own = facesOf(m?.pages)
  if (own.length) {
    const ownCover = m?.cover?.asset ? fromSanity(m.cover) : cover
    if (!ownCover) return null
    return <Magazine number={MAGAZINE_AT + 1} heading={m?.heading || c?.heading || ''} text={m?.text || c?.text || ''} brand={brand} division={division} cover={ownCover} pages={own} />
  }
  if (!hasMagazine || !cover) return null
  return <Magazine number={MAGAZINE_AT + 1} heading={m?.heading || c?.heading || ''} text={m?.text || c?.text || ''} brand={brand} division={division} cover={m?.cover?.asset ? fromSanity(m.cover) : cover} pages={facesOfSpreads(spreads)} />
}
