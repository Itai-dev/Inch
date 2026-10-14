import Link from 'next/link'
import { DivisionMark } from '@/components/brand/Marks'
import { TalentCard } from '@/components/TalentCard'
import { DEFAULT_STORY, STORY_FROM } from '@/lib/copy'
import { isPlaceholder } from '@/lib/placeholders'
import { creditLine } from '@/lib/slides'
import { sitePath, SITES, talentPath, type Site } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, TalentCard as TalentCardType } from '@/sanity/lib/types'
import { Magazine, type Spread } from './Magazine'
import { NameStrip, type StripName } from './NameStrip'
import { TypeOnView } from '@/components/motion/TypeOnView'
import { TypeText, typeEnd } from '@/components/motion/TypeText'
import { PrintPile, type Pic } from './PrintPile'
import { YearRuler } from './YearRuler'

/**
 * The home page below the statement: the agency's story in chapters, the board's names
 * running past, a row of selected models, and a way in for new faces. Most chapters are centred
 * and stacked: the heading and paragraph type in, then a pile of prints lands below them; one
 * is a magazine whose pages turn as you scroll.
 */

export type Chapter = { _key?: string; heading: string; text: string; images?: SanityImage[] | null }

const pad = (n: number) => String(n).padStart(2, '0')

const fromSanity = (img: SanityImage): Pic => ({ src: urlFor(img).width(1400).url(), alt: img.alt || '', credit: creditLine(img) || undefined })
const fromTalent = (t: TalentCardType): Pic | null =>
  t.cover?.asset ? { src: urlFor(t.cover).width(1400).url(), alt: t.name } : t.coverSrc ? { src: t.coverSrc, alt: '' } : null

/** The chapter told as a magazine instead of a pile (the second, when there are two or more). */
const MAGAZINE_AT = 1
/** Prints per pile (PrintPile places up to ten). */
const PRINTS = 10
const SPREADS = 5

/** Story → each chapter's text and three prints (its own pictures, else the board's covers, real ones first); one chapter as a magazine of the board. */
export function StorySection({ site, chapters, talents }: { site: Site; chapters?: Chapter[] | null; talents: TalentCardType[] }) {
  const { brand, division } = SITES[site]
  const story: Chapter[] = chapters?.length ? chapters : DEFAULT_STORY
  const board = [...talents.filter((t) => !isPlaceholder(t)), ...talents.filter(isPlaceholder)]
  const covers = board.map(fromTalent).filter((p): p is Pic => !!p)
  let next = 0
  const pics = story.map((c) => {
    const own = (c.images ?? []).filter((i) => i?.asset).map(fromSanity)
    while (own.length < PRINTS && covers.length) own.push(covers[next++ % covers.length])
    return own
  })
  // The magazine: the chapter's own pictures (named by their alt text), else the board, a model a spread.
  const magazine = story[MAGAZINE_AT]
  const ownSpreads: Spread[] = (magazine?.images ?? []).filter((i) => i?.asset).map((i) => ({ name: i.alt || '', pic: fromSanity(i) }))
  const spreads: Spread[] =
    ownSpreads.length >= 2
      ? ownSpreads
      : board.flatMap((t) => {
          const pic = fromTalent(t)
          return pic ? [{ name: t.name, pic: { ...pic, alt: t.name } }] : []
        }).slice(0, SPREADS)

  // The magazine's cover: the chapter's own first picture, else the board's first (real ones come first).
  const magCover = ownSpreads[0]?.pic ?? covers[0] ?? spreads[0]?.pic

  return (
    <section aria-labelledby="story-title" className="overflow-x-clip py-[clamp(80px,11vw,200px)]">
      <div className="flex items-baseline justify-between px-gutter">
        <h2 id="story-title" className="label text-muted">The story of {brand}</h2>
        <span className="label text-muted">{pad(story.length)} chapters</span>
      </div>
      {/* The years, sliding under a needle as the story scrolls up. */}
      <div className="mt-4">
        <YearRuler from={STORY_FROM} to={new Date().getFullYear()} />
      </div>

      <ol className="mt-[clamp(72px,9vw,160px)] flex flex-col gap-[clamp(120px,15vw,260px)] px-gutter">
        {story.map((c, i) => {
          const flip = i % 2 === 1
          const textAt = typeEnd(c.heading, 0, 45) + 150
          if (i === MAGAZINE_AT && spreads.length > 1)
            return (
              // Full width, out of the margins.
              <li key={c._key || i} className="-mx-[var(--gutter)]">
                <Magazine number={i + 1} heading={c.heading} text={c.text} brand={brand} division={division} cover={magCover} spreads={spreads} />
              </li>
            )
          return (
            <li key={c._key || i} className="flex flex-col items-center text-center">
              {/* The heading types in when it comes into view, then the paragraph. */}
              <TypeOnView className="flex flex-col items-center">
                <p className="flex items-center gap-3 text-[13px] font-extrabold tabular-nums">
                  <span aria-hidden className="h-[2px] w-10 bg-current" />
                  {pad(i + 1)}
                  <span aria-hidden className="h-[2px] w-10 bg-current" />
                </p>
                <h3 className="wordmark mt-5 text-[clamp(56px,8.5vw,150px)] uppercase leading-[0.82]">
                  <TypeText text={c.heading} ms={45} />
                </h3>
                <p className="mt-7 max-w-[44ch] whitespace-pre-line text-[17px] leading-snug md:text-[19px]">
                  <TypeText text={c.text} at={textAt} ms={10} />
                </p>
              </TypeOnView>
              {/* Prints on a wall, landing on the pile one after another. */}
              <PrintPile pics={pics[i]} flip={flip} className="mt-[clamp(40px,5vw,88px)] w-full max-w-[960px]" />
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** A model's pictures for the name strip: her cover and the start of her book. Placeholder models get a few placeholder looks. */
function stripPics(t: TalentCardType): string[] {
  const own = [t.coverSrc ?? (t.cover?.asset ? urlFor(t.cover).width(600).url() : null), ...(t.pics ?? []).filter((i) => i?.asset).map((i) => urlFor(i).width(600).url())]
  const pics = [...new Set(own.filter((s): s is string => !!s))] // the cover is often the book's first picture too
  if (pics.length > 1 || !isPlaceholder(t)) return pics
  const n = Number(t.coverSrc?.match(/look-(\d+)/)?.[1] ?? 1) - 1
  return [0, 3, 6, 9].map((j) => `/placeholders/look-${String(((n + j) % 10) + 1).padStart(2, '0')}.svg`)
}

/** The board's names running past in giant type; each opens her page, and hovering one flicks through her pictures. */
export function NameMarquee({ site, talents }: { site: Site; talents: TalentCardType[] }) {
  const { division } = SITES[site]
  const names: StripName[] = talents.slice(0, 12).map((t) => ({ name: t.name, href: talentPath(t), pics: stripPics(t) }))
  if (!names.length) return null
  return (
    <section aria-label="The board" className="overflow-hidden border-y-2 border-fg py-[clamp(16px,2vw,28px)]">
      <NameStrip names={names} mark={<DivisionMark division={division} size={28} />} />
    </section>
  )
}

/** Selected models in one even row, numbered, with the way to the whole board. Phones swipe along it. */
export function SelectedModels({ site, talents, total }: { site: Site; talents: TalentCardType[]; total: number }) {
  const picks = talents.slice(0, 6)
  if (!picks.length) return null
  const all = sitePath(site, '/models')
  return (
    <section aria-labelledby="selected-title" className="py-[clamp(72px,9vw,160px)]">
      <div className="mx-[var(--gutter)] mb-8 flex items-end justify-between gap-6 border-b-2 border-fg pb-4">
        <h2 id="selected-title" className="wordmark text-[clamp(28px,3vw,48px)] uppercase leading-none">Selected models</h2>
        <Link href={all} className="label hover:opacity-60">Show all ({total}) →</Link>
      </div>
      <ol className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-2 [scrollbar-width:none] md:grid md:grid-cols-6 md:gap-[clamp(16px,1.6vw,28px)] md:overflow-visible">
        {picks.map((t, i) => (
          <li key={t._id} className="w-[44vw] shrink-0 snap-start md:w-auto">
            <p className="mb-2 text-[13px] font-extrabold tabular-nums">{pad(i + 1)}</p>
            <TalentCard talent={t} priority={false} />
          </li>
        ))}
      </ol>
    </section>
  )
}

/** The last word: a way in for new faces. */
export function ApplyCallout({ site }: { site: Site }) {
  return (
    <section className="px-gutter pb-[clamp(80px,10vw,180px)]">
      <Link href={sitePath(site, '/apply')} className="group flex flex-col gap-5 border-t-2 border-fg pt-6 md:flex-row md:items-end md:justify-between">
        <span className="label text-muted">Become a model</span>
        <span className="wordmark text-[clamp(64px,12vw,220px)] uppercase leading-[0.8] transition-[letter-spacing] duration-500 ease-[var(--ease-out)] group-hover:tracking-[0.02em]">
          Get scouted →
        </span>
      </Link>
    </section>
  )
}
