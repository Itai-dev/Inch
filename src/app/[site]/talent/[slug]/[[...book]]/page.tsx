import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ModelSheet, type Book } from '@/components/ModelSheet'
import { decodeSlug, sitePath, SITES, talentPath, type Site } from '@/lib/sites'
import { imageSlides } from '@/lib/slides'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { TALENT_QUERY } from '@/sanity/lib/queries'
import type { Talent } from '@/sanity/lib/types'

/** Each book has its own URL so bookers can send exactly the right one. */
const BOOKS = [
  { segment: '', field: 'portfolio', title: 'Modelbook', view: 'book' },
  { segment: 'polaroids', field: 'polaroids', title: 'Polaroids', view: 'book' },
] as const

// Route params arrive URL-encoded ("SUN%20MIZRAHI"), so a slug typed with a space or an accent still has to match.
// Only this site's models: a DOT. model has no page on INCH” (and the other way round).
const load = async (site: Site, raw: string) => {
  const slug = decodeSlug(raw)
  return sanityFetch<Talent | null>(TALENT_QUERY, { slug, division: SITES[site].division }, null, ['talent'])
}

// Only the books she has pictures in: no Polaroids in the menu (or at its address) without polaroids.
const booksFor = (t: Talent): Book[] =>
  BOOKS.map((b) => ({ segment: b.segment, title: b.title, view: b.view, slides: imageSlides(t[b.field] ?? [], t.name) })).filter((b) => b.slides.length)

const tabsFor = (t: Talent) => [...booksFor(t), ...(t.bio ? [{ segment: 'bio', title: 'Bio' }] : [])]

export async function generateMetadata({ params }: PageProps<'/[site]/talent/[slug]/[[...book]]'>): Promise<Metadata> {
  const { site, slug, book } = await params
  const t = await load(site as Site, slug)
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
  const t = await load(site as Site, slug)
  if (!t) notFound()

  const tabs = tabsFor(t)
  const segment = book?.[0] ?? tabs[0]?.segment ?? ''
  if ((book?.length ?? 0) > 1 || (book && !tabs.some((x) => x.segment === segment))) notFound()

  const base = talentPath(t)
  return (
    <ModelSheet
      talent={{ _id: t._id, name: t.name, slug: t.slug, division: t.division, cover: t.cover }}
      name={t.name}
      division={t.division}
      measurements={t.measurements}
      bio={t.bio}
      instagram={t.instagram}
      books={booksFor(t)}
      initial={segment}
      base={base}
      compCard={`${base}/comp-card`}
      closeHref={sitePath(site as Site, '/models')}
    />
  )
}
