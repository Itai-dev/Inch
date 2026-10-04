import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Measurements } from '@/components/Measurements'
import { AddToSelectionButton } from '@/components/selection/AddToSelectionButton'
import { DIVISION_META } from '@/lib/divisions'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { TALENT_QUERY } from '@/sanity/lib/queries'
import type { SanityImage, Talent } from '@/sanity/lib/types'

const load = (slug: string) => sanityFetch<Talent | null>(TALENT_QUERY, { slug }, null, ['talent'])

export async function generateMetadata({ params }: PageProps<'/talent/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const t = await load(slug)
  if (!t) return {}
  return {
    title: t.name,
    description: `${t.name} — ${DIVISION_META[t.division].brand}`,
    openGraph: t.cover?.asset ? { images: [urlFor(t.cover).width(1200).height(630).url()] } : undefined,
  }
}

function Gallery({ id, title, images, cols }: { id: string; title: string; images?: SanityImage[]; cols: string }) {
  if (!images?.length) return null
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-6 text-sm uppercase tracking-wide text-muted">{title}</h2>
      <div className={`grid gap-4 ${cols}`}>
        {images.map((img, i) => (
          <div key={img._key || i} className="relative aspect-[3/4] bg-line">
            <Image src={urlFor(img).width(1200).url()} alt={img.alt || title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default async function TalentPage({ params }: PageProps<'/talent/[slug]'>) {
  const { slug } = await params
  const t = await load(slug)
  if (!t) notFound()

  return (
    <div className="flex flex-col gap-16 px-5 py-10 md:px-10">
      <header className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-6">
          <p className="text-sm uppercase tracking-wide text-muted">{DIVISION_META[t.division].brand}</p>
          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">{t.name}</h1>
          <Measurements m={t.measurements} division={t.division} />
          {t.instagram && (
            <a href={`https://instagram.com/${t.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-sm uppercase underline">
              Instagram @{t.instagram.replace('@', '')}
            </a>
          )}
          <nav className="flex gap-4 text-sm uppercase text-muted">
            <a href="#portfolio">Portfolio</a>
            <a href="#polaroids">Polaroids</a>
            {t.bio && <a href="#bio">Bio</a>}
          </nav>
          <div><AddToSelectionButton talent={t} /></div>
        </div>
        <div className="relative aspect-[3/4] bg-line">
          {t.cover?.asset && <Image src={urlFor(t.cover).width(1400).url()} alt={t.name} fill priority sizes="60vw" className="object-cover" />}
        </div>
      </header>
      <Gallery id="portfolio" title="Portfolio" images={t.portfolio} cols="md:grid-cols-3" />
      <Gallery id="polaroids" title="Polaroids" images={t.polaroids} cols="grid-cols-2 md:grid-cols-4" />
      {t.bio && (
        <section id="bio" className="max-w-2xl scroll-mt-24">
          <h2 className="mb-4 text-sm uppercase tracking-wide text-muted">Bio</h2>
          <p className="whitespace-pre-line text-lg">{t.bio}</p>
        </section>
      )}
    </div>
  )
}
