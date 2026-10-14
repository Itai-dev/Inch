import Image from 'next/image'
import Link from 'next/link'
import { DivisionMark } from '@/components/brand/Marks'
import { TalentCard } from '@/components/TalentCard'
import { DEFAULT_STORY } from '@/lib/copy'
import { isPlaceholder } from '@/lib/placeholders'
import { creditLine } from '@/lib/slides'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, TalentCard as TalentCardType } from '@/sanity/lib/types'

/**
 * The home page below the statement: the agency's story in chapters, the board's names
 * running past, a taste of the models, and a way in for new faces. The motion is CSS only
 * (scroll-driven, see globals.css), and stands still with reduced motion or where the
 * browser has no scroll timelines.
 */

export type Chapter = { _key?: string; heading: string; text: string; images?: SanityImage[] | null }
type Pic = { src: string; alt: string; credit?: string }

const pad = (n: number) => String(n).padStart(2, '0')

const fromSanity = (img: SanityImage): Pic => ({ src: urlFor(img).width(1400).url(), alt: img.alt || '', credit: creditLine(img) || undefined })
const fromTalent = (t: TalentCardType): Pic | null =>
  t.cover?.asset ? { src: urlFor(t.cover).width(1400).url(), alt: t.name } : t.coverSrc ? { src: t.coverSrc, alt: '' } : null

/** Where each print lands on the pile: offset (share of its own size) and angle. */
const PILE = [
  { x: '-92%', y: '-62%', r: '-4deg' },
  { x: '-12%', y: '-52%', r: '3deg' },
  { x: '-52%', y: '-34%', r: '-1.5deg' },
]

/** Story → each chapter's text and three prints (its own pictures, else the board's covers, real ones first). */
export function StorySection({ site, chapters, talents }: { site: Site; chapters?: Chapter[] | null; talents: TalentCardType[] }) {
  const { brand } = SITES[site]
  const story: Chapter[] = chapters?.length ? chapters : DEFAULT_STORY
  const covers = [...talents.filter((t) => !isPlaceholder(t)), ...talents.filter(isPlaceholder)].map(fromTalent).filter((p): p is Pic => !!p)
  let next = 0
  const pics = story.map((c) => {
    const own = (c.images ?? []).filter((i) => i?.asset).map(fromSanity)
    while (own.length < PILE.length && covers.length) own.push(covers[next++ % covers.length])
    return own
  })

  return (
    <section aria-labelledby="story-title" className="overflow-x-clip py-[clamp(80px,11vw,200px)]">
      <div className="flex items-baseline justify-between px-gutter">
        <h2 id="story-title" className="label text-muted">The story of {brand}</h2>
        <span className="label text-muted">{pad(story.length)} chapters</span>
      </div>
      {/* A long ruler that slides sideways as the story scrolls past. */}
      <div aria-hidden className="mt-4 overflow-hidden">
        <div className="story-ruler flex w-max">
          {Array.from({ length: 60 }, (_, i) => (
            <span key={i} className="flex h-10 w-16 shrink-0 flex-col justify-between border-l-2 border-current">
              <span className="pl-1 text-[12px] font-extrabold leading-none tabular-nums">{i}</span>
              <span
                className="block h-3"
                style={{ backgroundImage: 'repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 8px)', backgroundPosition: 'left bottom', backgroundRepeat: 'repeat-x' }}
              />
            </span>
          ))}
        </div>
      </div>

      <ol className="mt-[clamp(72px,9vw,160px)] flex flex-col gap-[clamp(120px,15vw,260px)] px-gutter">
        {story.map((c, i) => {
          const flip = i % 2 === 1
          return (
            <li key={c._key || i} className="grid items-center gap-y-14 md:grid-cols-12 md:gap-x-6">
              <div className={`flex flex-col md:col-span-5 ${flip ? 'md:col-start-8' : 'md:col-start-1'} md:row-start-1`}>
                <p className="flex items-center gap-3 text-[13px] font-extrabold tabular-nums">
                  {pad(i + 1)}
                  <span aria-hidden className="h-[2px] w-14 bg-current" />
                </p>
                <h3 className="story-rise wordmark mt-5 text-[clamp(56px,8.5vw,150px)] uppercase leading-[0.82]">{c.heading}</h3>
                <p className="mt-7 max-w-[38ch] whitespace-pre-line text-[17px] leading-snug md:text-[19px]">{c.text}</p>
              </div>
              {/* Prints on a wall: small, black and white, landing on the pile one after another as the chapter scrolls in. */}
              <div className={`story-pile relative h-[clamp(340px,36vw,540px)] md:col-span-6 md:row-start-1 ${flip ? 'md:col-start-1' : 'md:col-start-7'}`}>
                {pics[i].map((pic, k) => (
                  <figure
                    key={k}
                    className="story-print absolute left-1/2 top-1/2 w-[clamp(150px,15vw,240px)] bg-white p-[5%] pb-[13%] shadow-[0_1px_2px_rgb(0_0_0/0.08),8px_14px_28px_-10px_rgb(0_0_0/0.35)]"
                    style={{ '--x': PILE[k].x, '--y': PILE[k].y, '--r': flip ? `calc(${PILE[k].r} * -1)` : PILE[k].r, '--k': k, zIndex: k } as React.CSSProperties}
                  >
                    <span className="relative block aspect-[4/5] overflow-hidden bg-line">
                      <Image src={pic.src} alt={pic.alt} fill sizes="240px" unoptimized={pic.src.endsWith('.svg')} className="object-cover grayscale contrast-[1.08]" />
                    </span>
                    {pic.credit && <figcaption className="absolute bottom-[3%] left-[5%] text-[9px] uppercase tracking-wide text-[#6f6f6f]">{pic.credit}</figcaption>}
                  </figure>
                ))}
              </div>
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
      <ul className="grid grid-cols-2 gap-x-[3px] gap-y-6 md:grid-cols-3 xl:grid-cols-6 md:max-xl:[&>li:nth-child(3n+2)]:translate-y-14 xl:[&>li:nth-child(even)]:translate-y-16">
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
