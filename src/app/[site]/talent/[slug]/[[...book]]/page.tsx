import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { ModelSheet, type Book } from '@/components/ModelSheet'
import { isPlaceholder, placeholderBook, placeholderTalent } from '@/lib/placeholders'
import { siteForDivision, sitePath, talentPath, type Site } from '@/lib/sites'
import { imageSlides } from '@/lib/slides'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { TALENT_QUERY } from '@/sanity/lib/queries'
import type { Talent } from '@/sanity/lib/types'

/** Each book has its own URL so bookers can send exactly the right one. */
const BOOKS = [
  { segment: '', field: 'portfolio', title: 'Modelbook', view: 'book', placeholders: 12 },
  { segment: 'covers', field: 'coversAds', title: 'Covers + Ads', view: 'book', placeholders: 6 },
  { segment: 'polaroids', field: 'polaroids', title: 'Polaroids', view: 'thumbnails', placeholders: 8 },
] as const

const load = async (slug: string) => (await sanityFetch<Talent | null>(TALENT_QUERY, { slug }, null, ['talent'])) ?? placeholderTalent(slug)

const booksFor = (t: Talent): Book[] =>
  BOOKS.map((b) => ({
    segment: b.segment,
    title: b.title,
    view: b.view,
    slides: isPlaceholder(t) ? placeholderBook(t, b.placeholders) : imageSlides(t[b.field] ?? [], t.name),
  })).filter((b) => b.slides.length)

const tabsFor = (t: Talent) => [...booksFor(t), ...(t.bio ? [{ segment: 'bio', title: 'Bio' }] : [])]

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
    robots: isPlaceholder(t) ? { index: false } : undefined,
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

  const base = talentPath(t)
  const placeholder = isPlaceholder(t)
  return (
    <ModelSheet
      talent={placeholder ? null : { _id: t._id, name: t.name, slug: t.slug, division: t.division, cover: t.cover }}
      name={t.name}
      division={t.division}
      measurements={t.measurements}
      bio={t.bio}
      instagram={t.instagram}
      books={booksFor(t)}
      initial={segment}
      base={base}
      compCard={placeholder ? null : `${base}/comp-card`}
      closeHref={sitePath(site as Site, '/models')}
    />
  )
}
