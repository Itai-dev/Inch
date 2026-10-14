import Image from 'next/image'
import Link from 'next/link'
import { isPlaceholder } from '@/lib/placeholders'
import { talentPath } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import type { TalentCard as TalentCardType } from '@/sanity/lib/types'
import { BoardView } from './BoardView'
import { AddToSelectionButton } from './selection/AddToSelectionButton'

const coverUrl = (t: TalentCardType) => t.coverSrc ?? (t.cover?.asset ? urlFor(t.cover).width(600).height(800).url() : null)

export function TalentCard({ talent, priority }: { talent: TalentCardType; priority?: boolean }) {
  const src = coverUrl(talent)
  return (
    <article className="group relative">
      <Link href={talentPath(talent)} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-line">
          {src && (
            <Image
              src={src}
              alt={talent.name}
              fill
              sizes="(min-width: 1280px) 17vw, (min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
              unoptimized={src.endsWith('.svg')}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          )}
        </div>
        <h3 className="wordmark mt-3 px-1 text-center text-[19px] uppercase leading-none md:text-[26px]">
          {talent.name}
        </h3>
      </Link>
      {!isPlaceholder(talent) && (
        <div className="absolute right-2 top-2 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <AddToSelectionButton talent={talent} compact />
        </div>
      )}
    </article>
  )
}

/** The board: room around every model, the name large and centred below. */
export function TalentGrid({ talents }: { talents: TalentCardType[] }) {
  if (!talents.length) {
    return <p className="py-20 text-center text-muted">No talents yet — add them in the Studio.</p>
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 md:gap-x-[clamp(20px,2.2vw,40px)] md:gap-y-[clamp(48px,5vw,88px)] lg:grid-cols-5">
      {talents.map((t, i) => (
        <TalentCard key={t._id} talent={t} priority={i < 6} />
      ))}
    </div>
  )
}

/** The board as a list: a row a model, numbered, with a small picture and the name large. */
export function TalentList({ talents }: { talents: TalentCardType[] }) {
  if (!talents.length) return null
  return (
    <ol className="border-b border-line">
      {talents.map((t, i) => {
        const src = coverUrl(t)
        return (
          <li key={t._id} className="border-t border-line">
            <Link href={talentPath(t)} className="group grid grid-cols-[2.5rem_56px_1fr_auto] items-center gap-x-4 py-3 md:grid-cols-[4rem_72px_1fr_auto] md:gap-x-8 md:py-4">
              <span className="text-[13px] font-extrabold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className="relative block aspect-[3/4] overflow-hidden bg-line">
                {src && <Image src={src} alt="" fill sizes="72px" unoptimized={src.endsWith('.svg')} className="object-cover" />}
              </span>
              <span className="wordmark text-[clamp(26px,3.6vw,60px)] uppercase leading-none transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-2">
                {t.name}
              </span>
              <span aria-hidden className="label text-muted transition-opacity md:opacity-0 md:group-hover:opacity-100">View →</span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

/** The board with its view switch: thumbnails or list. */
export function TalentBoard({ talents }: { talents: TalentCardType[] }) {
  return <BoardView count={talents.length} grid={<TalentGrid talents={talents} />} list={<TalentList talents={talents} />} />
}

