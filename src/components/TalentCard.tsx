import Image from 'next/image'
import Link from 'next/link'
import { rulerTicks, rulerTicksDown, SEG_OVERLAP } from '@/lib/ruler'
import { talentPath } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import type { TalentCard as TalentCardType } from '@/sanity/lib/types'
import { BoardView } from './BoardView'
import { AddToSelectionButton } from './selection/AddToSelectionButton'

const coverUrl = (t: TalentCardType) => (t.cover?.asset ? urlFor(t.cover).width(600).height(800).url() : null)

/** The gap between cards on the board (and in Selected models): as close as they go. */
export const BOARD_GAP = '3px'

/**
 * A model on the board. With `n`, she stands on her numbered stretch of the INCH” ruler, which
 * reaches across the gap to the next card so a row reads as one ruler (`.ruler-board` lights it on hover).
 */
export function TalentCard({ talent, priority, n }: { talent: TalentCardType; priority?: boolean; n?: number }) {
  const src = coverUrl(talent)
  return (
    <article className={`group relative ${n ? 'ruler-cell' : ''}`}>
      <Link href={talentPath(talent)} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-line">
          {src && (
            <Image
              src={src}
              alt={talent.name}
              fill
              sizes="(min-width: 1280px) 17vw, (min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,0.8,0.25,1)] group-hover:scale-[1.03]"
            />
          )}
        </div>
        <h3 className="wordmark mt-3 px-1 text-center text-[19px] uppercase leading-none md:text-[26px]">
          {talent.name}
        </h3>
      </Link>
      {n !== undefined && (
        <span aria-hidden className="ruler-seg relative mt-4 block h-[30px]" style={{ width: `calc(100% + ${BOARD_GAP} + ${SEG_OVERLAP})` }}>
          {/* Her number in the middle of her inch, as on the hero ruler. */}
          <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[11px] font-extrabold tabular-nums leading-none">{String(n).padStart(2, '0')}</span>
          <span className="ruler-draw absolute inset-x-0 bottom-0 block h-4" style={rulerTicks(16, 9)} />
        </span>
      )}
      <div className="absolute right-2 top-2 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
        <AddToSelectionButton talent={talent} compact />
      </div>
    </article>
  )
}

/** The board: the cards almost touching, each model on her numbered stretch of ruler, the name centred below. */
export function TalentGrid({ talents }: { talents: TalentCardType[] }) {
  if (!talents.length) {
    return <p className="py-20 text-center text-muted">The board is being updated.</p>
  }
  return (
    <div className="ruler-board grid grid-cols-2 gap-y-10 sm:grid-cols-3 md:grid-cols-4 md:gap-y-[clamp(44px,4.4vw,72px)] lg:grid-cols-5" style={{ columnGap: BOARD_GAP }}>
      {talents.map((t, i) => (
        <TalentCard key={t._id} talent={t} priority={i < 6} n={i + 1} />
      ))}
    </div>
  )
}

/** The board as a list: a row a model, a small picture and the name large, on one long tape down the left, a stretch a model. */
export function TalentList({ talents }: { talents: TalentCardType[] }) {
  if (!talents.length) return null
  return (
    <ol className="ruler-board border-l border-current/40">
      {talents.map((t, i) => {
        const src = coverUrl(t)
        return (
          <li key={t._id} className="ruler-cell group relative">
            {/* The row's inch marks carried across the whole screen, edge to edge (the list sits in the
                page's gutter); lit with the row. Its closing line lies on the next row's opening one. */}
            <span aria-hidden className="ruler-seg pointer-events-none absolute -inset-x-[var(--gutter)] top-0 h-px bg-current" />
            <span aria-hidden className="ruler-seg pointer-events-none absolute -inset-x-[var(--gutter)] -bottom-px h-px bg-current" />
            <div className="grid grid-cols-[2.75rem_44px_1fr] items-center gap-x-3 md:grid-cols-[6rem_72px_1fr_auto] md:gap-x-8">
              <span aria-hidden className="ruler-seg relative self-stretch" style={{ ...rulerTicksDown(26, 9), marginBottom: `-${SEG_OVERLAP}` }}>
                <span className="absolute left-[30px] top-1/2 -translate-y-1/2 text-[11px] md:left-[34px] md:text-[12px] font-extrabold tabular-nums leading-none">{String(i + 1).padStart(2, '0')}</span>
              </span>
              {/* The picture comes along with the name on hover, a little larger. */}
              <span className="relative my-3 block aspect-[3/4] overflow-hidden bg-line transition-transform duration-[450ms] ease-[cubic-bezier(0.22,0.8,0.25,1)] group-hover:translate-x-2 group-hover:scale-[1.06] md:my-4">
                {src && <Image src={src} alt="" fill sizes="72px" unoptimized={src.endsWith('.svg')} className="object-cover" />}
              </span>
              {/* The name, with add to selection beside it (on a phone, in a column at the right edge). The link is the name but covers the whole
                  row (its ::after); the button sits above that, so it selects rather than opens her page. */}
              {/* (The hover shift is on the name and the button, not this wrapper: a transformed wrapper would
                  hold the link's ::after to itself.) */}
              <span className="flex min-w-0 items-center justify-between gap-2.5 md:justify-start md:gap-5">
                <Link href={talentPath(t)} className="wordmark text-[clamp(21px,3.6vw,60px)] uppercase leading-none after:absolute after:inset-0">
                  <span className="block transition-transform duration-[450ms] ease-[cubic-bezier(0.22,0.8,0.25,1)] group-hover:translate-x-2">{t.name}</span>
                </Link>
                <span className="relative z-10 transition-[opacity,transform] duration-[450ms] ease-[cubic-bezier(0.22,0.8,0.25,1)] group-hover:translate-x-2 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                  <AddToSelectionButton talent={t} compact onPage />
                </span>
              </span>
              {/* On a phone the row is too narrow for it; the whole row opens her page anyway. */}
              <span aria-hidden className="label hidden text-muted transition-opacity md:block md:opacity-0 md:group-hover:opacity-100">View →</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** The board with its view switch: thumbnails or list. */
export function TalentBoard({ talents }: { talents: TalentCardType[] }) {
  return <BoardView grid={<TalentGrid talents={talents} />} list={<TalentList talents={talents} />} />
}

