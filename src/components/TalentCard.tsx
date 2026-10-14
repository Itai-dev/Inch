import Image from 'next/image'
import Link from 'next/link'
import { isPlaceholder } from '@/lib/placeholders'
import { talentPath } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import type { TalentCard as TalentCardType } from '@/sanity/lib/types'
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
        <h3 className="wordmark mt-3 px-1 text-center text-[17px] uppercase leading-none md:text-[22px]">
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
