import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import type { TalentCard as TalentCardType } from '@/sanity/lib/types'
import { AddToSelectionButton } from './selection/AddToSelectionButton'

export function TalentCard({ talent, priority }: { talent: TalentCardType; priority?: boolean }) {
  return (
    <article className="group relative">
      <Link href={`/talent/${talent.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-line">
          {talent.cover?.asset && (
            <Image
              src={urlFor(talent.cover).width(900).height(1200).url()}
              alt={talent.name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              priority={priority}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          )}
        </div>
        <h3 className="mt-3 text-sm uppercase tracking-wide">{talent.name}</h3>
      </Link>
      <div className="absolute right-2 top-2">
        <AddToSelectionButton talent={talent} compact />
      </div>
    </article>
  )
}

export function TalentGrid({ talents }: { talents: TalentCardType[] }) {
  if (!talents.length) {
    return <p className="py-20 text-center text-muted">No talents yet — add them in the Studio.</p>
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {talents.map((t, i) => (
        <TalentCard key={t._id} talent={t} priority={i < 4} />
      ))}
    </div>
  )
}
