import { creditLine } from '@/lib/slides'
import { SITES, type Site } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/types'
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
  pages?: ({ _type: 'page'; image?: SanityImage | null; name?: string | null; caption?: string | null } | { _type: 'spread'; image?: SanityImage | null; caption?: string | null })[] | null
} | null

const fromSanity = (img: SanityImage): Pic => ({ src: urlFor(img).width(1400).url(), alt: img.alt || '', credit: creditLine(img) || undefined })

/** The chapter told as the magazine: the first. */
const MAGAZINE_AT = 0

type StoryProps = { site: Site; chapters?: Chapter[] | null; magazine?: MagazineDoc }

/** The Studio's pages in book order, from the first right page: a spread starts on a left page (a blank page goes before it when it would not). */
function facesOf(pages: NonNullable<MagazineDoc>['pages']): Face[] {
  const faces: Face[] = []
  for (const p of pages ?? []) {
    // The photo, with its caption printed at its foot: the page's Caption, or else (a photo page
    // having no other use for it) the text in its Name field.
    const caption = p.caption?.trim() || (p._type === 'page' ? p.name?.trim() : '') || undefined
    const pic = p.image?.asset ? { ...fromSanity(p.image), credit: caption } : null
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

/** The older layout as pages: the first picture, then each next one's name facing its picture. */
const facesOfSpreads = (spreads: Spread[]): Face[] =>
  spreads.flatMap((s, k) => (k === 0 ? [{ kind: 'photo', pic: s.pic } as Face] : [{ kind: 'name', name: s.name } as Face, { kind: 'photo', pic: s.pic } as Face]))

/**
 * The magazine, right after the statement: only what the Studio's Home page holds (its Magazine's
 * pages, else an older story chapter's own pictures). With neither there is no magazine: the
 * models' photos are never put in it by themselves.
 */
export function StoryMagazine({ site, chapters, magazine: m }: StoryProps) {
  const { brand, division } = SITES[site]
  const c = chapters?.[MAGAZINE_AT]
  const own = facesOf(m?.pages)
  // The older layout: the chapter's own pictures, named by their alt text.
  const spreads: Spread[] = (c?.images ?? []).filter((i) => i?.asset).map((i) => ({ name: i.alt || '', pic: fromSanity(i) }))
  const pages = own.length ? own : spreads.length > 1 ? facesOfSpreads(spreads) : []
  if (!pages.length) return null
  // The cover: the one chosen, else the first photo inside.
  const first = pages.find((f) => f.kind !== 'name' && f.kind !== 'blank')
  const cover = m?.cover?.asset ? fromSanity(m.cover) : first && 'pic' in first ? first.pic : null
  if (!cover) return null
  return <Magazine number={MAGAZINE_AT + 1} heading={m?.heading || c?.heading || ''} text={m?.text || c?.text || ''} brand={brand} division={division} cover={cover} pages={pages} />
}
