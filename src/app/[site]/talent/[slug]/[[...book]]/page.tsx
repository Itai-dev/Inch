import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { BookViewer } from '@/components/BookViewer'
import { BlinkOpen } from '@/components/motion/BlinkOpen'
import { DotOpen } from '@/components/motion/DotOpen'
import { Measurements } from '@/components/Measurements'
import { AddToSelectionButton } from '@/components/selection/AddToSelectionButton'
import { siteForDivision, talentPath, type Site } from '@/lib/sites'
import { imageSlides } from '@/lib/slides'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { TALENT_QUERY } from '@/sanity/lib/queries'
import type { Talent } from '@/sanity/lib/types'

/** Each book has its own URL so bookers can send exactly the right one. */
const BOOKS = [
  { segment: '', field: 'portfolio', title: 'Portfolio', view: 'book' },
  { segment: 'covers', field: 'coversAds', title: 'Covers + Ads', view: 'book' },
  { segment: 'polaroids', field: 'polaroids', title: 'Polaroids', view: 'thumbnails' },
] as const

type Tab = { segment: string; title: string }

const load = (slug: string) => sanityFetch<Talent | null>(TALENT_QUERY, { slug }, null, ['talent'])

const tabsFor = (t: Talent): Tab[] => [
  ...BOOKS.filter((b) => t[b.field]?.length),
  ...(t.bio ? [{ segment: 'bio', title: 'Bio' }] : []),
]

export async function generateMetadata({ params }: PageProps<'/[site]/talent/[slug]/[[...book]]'>): Promise<Metadata> {
  const { slug, book } = await params
  const t = await load(slug)
  if (!t) return {}
  const segment = book?.[0] ?? ''
  const tab = tabsFor(t).find((x) => x.segment === segment)
  return {
    title: tab && segment ? `${t.name} — ${tab.title}` : t.name,
    alternates: { canonical: talentPath(t) + (segment ? `/${segment}` : '') },
    openGraph: t.cover?.asset ? { images: [urlFor(t.cover).width(1200).height(630).url()] } : undefined,
  }
}

export default async function TalentPage({ params }: PageProps<'/[site]/talent/[slug]/[[...book]]'>) {
  const { site, slug, book } = await params
  const t = await load(slug)
  if (!t) notFound()
  // A DOT. model only lives on DOT. (and vice versa).
  if (siteForDivision(t.division) !== (site as Site)) redirect(talentPath(t) + (book?.length ? `/${book.join('/')}` : ''))

  const tabs = tabsFor(t)
  const segment = book?.[0] ?? tabs[0]?.segment ?? ''
  if ((book?.length ?? 0) > 1 || (book && !tabs.some((x) => x.segment === segment))) notFound()
  const active = BOOKS.find((b) => b.segment === segment)

  const base = talentPath(t)
  const isDot = t.division === 'men'
  const cover = t.cover?.asset ? urlFor(t.cover).width(1400).url() : null
  const handle = t.instagram?.replace('@', '')

  return (
    <div className="flex flex-col gap-12 py-10">
      <header className="grid gap-10 px-5 md:grid-cols-[1fr_1.4fr] md:px-10">
        <div className="flex flex-col gap-6">
          <h1 className="wordmark text-6xl uppercase md:text-8xl">{t.name}</h1>
          <Measurements m={t.measurements} division={t.division} />
          <div className="label flex flex-wrap gap-6">
            {handle && (
              <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer" className="underline">
                IG @{handle}
              </a>
            )}
            <a href={`${base}/comp-card`} className="underline">Comp card PDF</a>
          </div>
          <div><AddToSelectionButton talent={t} /></div>
        </div>
        {cover &&
          (isDot ? (
            <DotOpen src={cover} alt={t.name} className="w-full" />
          ) : (
            <BlinkOpen src={cover} alt={t.name} className="w-full" />
          ))}
      </header>

      {tabs.length > 0 && (
        <nav className="label flex flex-wrap gap-6 border-b border-line px-5 pb-3 md:px-10" aria-label="Books">
          {tabs.map((x) => (
            <Link
              key={x.segment}
              href={x.segment ? `${base}/${x.segment}` : base}
              scroll={false}
              aria-current={x.segment === segment ? 'page' : undefined}
              className={x.segment === segment ? 'text-fg' : 'text-muted hover:text-fg'}
            >
              {x.title}
            </Link>
          ))}
        </nav>
      )}

      {active && !!t[active.field]?.length && (
        <BookViewer key={active.segment} slides={imageSlides(t[active.field], t.name)} isDot={isDot} defaultView={active.view} />
      )}
      {segment === 'bio' && t.bio && (
        <section className="max-w-2xl px-5 md:px-10">
          <p className="whitespace-pre-line text-lg">{t.bio}</p>
        </section>
      )}
    </div>
  )
}
