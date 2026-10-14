import Link from 'next/link'
import { DivisionMark } from '@/components/brand/Marks'
import { TalentCard } from '@/components/TalentCard'
import { DEFAULT_STORY, STORY_FROM } from '@/lib/copy'
import { isPlaceholder } from '@/lib/placeholders'
import { creditLine } from '@/lib/slides'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, TalentCard as TalentCardType } from '@/sanity/lib/types'
import { Magazine, type Spread } from './Magazine'
import { TypeOnView } from '@/components/motion/TypeOnView'
import { TypeText, typeEnd } from '@/components/motion/TypeText'
import { PrintPile, type Pic } from './PrintPile'
import { YearRuler } from './YearRuler'

/**
 * The home page below the statement: the agency's story in chapters, the board's names
 * running past, a taste of the models, and a way in for new faces. Most chapters are centred
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
  const { brand } = SITES[site]
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
                <Magazine number={i + 1} heading={c.heading} text={c.text} brand={brand} spreads={spreads} />
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

/** The board's names running past in giant type, every other one in outline; all of it links to the board. */
export function NameMarquee({ site, talents }: { site: Site; talents: TalentCardType[] }) {
  const { division } = SITES[site]
  const names = talents.slice(0, 12).map((t) => t.name)
  if (!names.length) return null
  const row = (copy: number) => (
    <ul aria-hidden={copy > 0 || undefined} className="flex shrink-0 items-center">
      {names.map((n, i) => (
        <li key={n} className="flex items-center gap-[0.3em] pr-[0.3em]">
          <span className={`wordmark whitespace-nowrap uppercase ${i % 2 ? 'marquee-outline' : ''}`}>{n}</span>
          <DivisionMark division={division} size={28} />
        </li>
      ))}
    </ul>
  )
  return (
    <section aria-label="The board" className="overflow-hidden border-y-2 border-fg py-[clamp(16px,2vw,28px)]">
      <Link href={sitePath(site, '/models')} className="marquee-track flex w-max text-[clamp(56px,9vw,160px)] leading-none">
        {row(0)}
        {row(1)}
      </Link>
    </section>
  )
}

/** Six models, staggered, and the way to the whole board. */
export function ModelsTaste({ site, talents, total }: { site: Site; talents: TalentCardType[]; total: number }) {
  const taste = talents.slice(0, 6)
  if (!taste.length) return null
  const all = sitePath(site, '/models')
  return (
    <section aria-labelledby="taste-title" className="px-gutter py-[clamp(72px,9vw,160px)]">
      <div className="mb-10 flex items-end justify-between gap-6">
        <h2 id="taste-title" className="label text-muted">A taste of the board</h2>
        <Link href={all} className="label hover:opacity-60">Show all ({total}) →</Link>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-6 md:max-xl:[&>li:nth-child(3n+2)]:translate-y-14 xl:[&>li:nth-child(even)]:translate-y-16">
        {taste.map((t, i) => (
          <li key={t._id}>
            <TalentCard talent={t} priority={i < 2} />
          </li>
        ))}
      </ul>
      <div className="mt-[clamp(80px,9vw,150px)] flex justify-center">
        <Link href={all} className="flex h-14 items-center bg-fg px-10 text-[15px] font-bold uppercase tracking-[0.04em] text-bg hover:opacity-85" style={{ fontStretch: '80%' }}>
          Show all models →
        </Link>
      </div>
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
