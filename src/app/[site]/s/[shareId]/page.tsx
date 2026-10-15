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
    <div className="px-gutter py-10">
      <p className="label text-muted">Selection by {brand}</p>
      <h1 className="wordmark mt-3 text-[clamp(40px,5vw,80px)] uppercase leading-[0.9]">{sel.title}</h1>
      {sel.note && <p className="mt-4 max-w-2xl whitespace-pre-line text-lg">{sel.note}</p>}
      <div className="mt-12 grid gap-x-[3px] gap-y-10 sm:grid-cols-2 md:grid-cols-4">
        {talents.map((t) => (
          <article key={t._id} className="flex flex-col gap-3">
            <Link href={talentPath(t)} className="relative block aspect-[3/4] bg-line">
              {t.cover?.asset && <Image src={urlFor(t.cover).width(900).url()} alt={t.name} fill sizes="33vw" className="object-cover" />}
            </Link>
            <h2 className="wordmark text-[22px] uppercase">{t.name}</h2>
            <Measurements m={t.measurements} division={t.division} />
          </article>
        ))}
      </div>
      <div className="mt-16 flex flex-wrap gap-3 text-[14px] font-bold uppercase tracking-[0.04em]" style={{ fontStretch: '80%' }}>
        {/* The same selection as comp cards: one PDF, a page a model, each linking back to her page. */}
        <a href={`${sitePath(owner, '/comp-cards')}?ids=${talents.map((t) => t._id).join(',')}`} download className="inline-flex h-12 items-center bg-fg px-7 text-bg hover:opacity-85">
          {talents.length > 1 ? `Comp cards (${talents.length}) · PDF` : 'Comp card · PDF'}
        </a>
        <Link href={sitePath(owner, '/contact')} className="inline-flex h-12 items-center border border-fg px-7 hover:bg-fg hover:text-bg">Contact {brand} about this selection</Link>
      </div>
    </div>
  )
}
