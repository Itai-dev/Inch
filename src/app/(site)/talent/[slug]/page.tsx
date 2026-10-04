import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { DivisionTheme } from '@/components/brand/DivisionTheme'
import { DivisionMark } from '@/components/brand/Marks'
import { BlinkOpen } from '@/components/motion/BlinkOpen'
import { DotIndexCarousel } from '@/components/motion/DotIndexCarousel'
import { DotOpen } from '@/components/motion/DotOpen'
import { TapeCarousel } from '@/components/motion/TapeCarousel'
import { Measurements } from '@/components/Measurements'
import { imageSlides } from '@/lib/slides'
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
      <h2 className="label mb-6 text-muted">{title}</h2>
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
  const isDot = t.division === 'men'
  const cover = t.cover?.asset ? urlFor(t.cover).width(1400).url() : null

  return (
    <div className="flex flex-col gap-16 px-5 py-10 md:px-10">
      <DivisionTheme division={t.division} />
      <header className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-6">
          <p className="label flex items-center gap-2 text-muted"><DivisionMark division={t.division} size={10} /> {DIVISION_META[t.division].brand}</p>
          <h1 className="wordmark text-6xl uppercase md:text-8xl">{t.name}</h1>
          <Measurements m={t.measurements} division={t.division} />
          {t.instagram && (
            <a href={`https://instagram.com/${t.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-sm uppercase underline">
              Instagram @{t.instagram.replace('@', '')}
            </a>
          )}
          <nav className="label flex gap-6 text-muted">
            <a href="#portfolio">Portfolio</a>
            <a href="#polaroids">Polaroids</a>
            {t.bio && <a href="#bio">Bio</a>}
          </nav>
          <div><AddToSelectionButton talent={t} /></div>
        </div>
        {cover &&
          (isDot ? (
            <DotOpen src={cover} alt={t.name} className="w-full" />
          ) : (
            <BlinkOpen src={cover} alt={t.name} className="w-full" />
          ))}
      </header>
      {!!t.portfolio?.length && (
        <section id="portfolio" className="-mx-5 scroll-mt-24 md:-mx-10">
          <h2 className="label mb-2 px-5 text-muted md:px-10">Portfolio</h2>
          {isDot ? (
            <DotIndexCarousel slides={imageSlides(t.portfolio, t.name)} height="90dvh" />
          ) : (
            <TapeCarousel slides={imageSlides(t.portfolio, t.name)} height="92dvh" />
          )}
        </section>
      )}
      <Gallery id="polaroids" title="Polaroids" images={t.polaroids} cols="grid-cols-2 md:grid-cols-4" />
      {t.bio && (
        <section id="bio" className="max-w-2xl scroll-mt-24">
          <h2 className="label mb-4 text-muted">Bio</h2>
          <p className="whitespace-pre-line text-lg">{t.bio}</p>
        </section>
      )}
    </div>
  )
}
