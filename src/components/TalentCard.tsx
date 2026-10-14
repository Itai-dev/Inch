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
        <h3 className="mt-2 px-1 text-center text-[12px] font-bold uppercase leading-tight md:text-[13px]" style={{ fontStretch: '80%' }}>
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

/** The board: cards almost touching, names small and centred below. */
export function TalentGrid({ talents }: { talents: TalentCardType[] }) {
  if (!talents.length) {
    return <p className="py-20 text-center text-muted">No talents yet — add them in the Studio.</p>
  }
  return (
    <div className="grid grid-cols-2 gap-x-[3px] gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {talents.map((t, i) => (
        <TalentCard key={t._id} talent={t} priority={i < 6} />
      ))}
    </div>
  )
}
