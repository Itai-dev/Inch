import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Measurements } from '@/components/Measurements'
import { siteForDivision, sitePath, SITES, talentPath, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { SELECTION_QUERY } from '@/sanity/lib/queries'
import type { Division, Talent } from '@/sanity/lib/types'

type Sel = { title: string; note?: string; division?: Division; talents: Talent[] } | null

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function SharedSelectionPage({ params }: PageProps<'/[site]/s/[shareId]'>) {
  const { site, shareId } = await params
  const sel = await sanityFetch<Sel>(SELECTION_QUERY, { shareId }, null, ['selection'])
  if (!sel) notFound()
  const owner = siteForDivision(sel.division ?? 'women')
  if (owner !== (site as Site)) redirect(sitePath(owner, `/s/${shareId}`))
  const { brand } = SITES[owner]
  const talents = sel.talents.filter(Boolean)

  return (
    <div className="px-5 py-10 md:px-10">
      <p className="text-sm uppercase tracking-wide text-muted">Selection by {brand}</p>
      <h1 className="mt-2 text-5xl font-bold tracking-tight">{sel.title}</h1>
      {sel.note && <p className="mt-4 max-w-2xl whitespace-pre-line text-lg">{sel.note}</p>}
      <div className="mt-12 grid gap-10 md:grid-cols-3">
        {talents.map((t) => (
          <article key={t._id} className="flex flex-col gap-3">
            <Link href={talentPath(t)} className="relative block aspect-[3/4] bg-line">
              {t.cover?.asset && <Image src={urlFor(t.cover).width(900).url()} alt={t.name} fill sizes="33vw" className="object-cover" />}
            </Link>
            <h2 className="uppercase tracking-wide">{t.name}</h2>
            <Measurements m={t.measurements} division={t.division} />
          </article>
        ))}
      </div>
      <Link href={sitePath(owner, '/contact')} className="mt-16 inline-block bg-fg px-6 py-3 text-sm uppercase tracking-wide text-bg">Contact {brand} about this selection</Link>
    </div>
  )
}
