import Link from 'next/link'
import { TalentGrid } from '@/components/TalentCard'
import { sanityFetch } from '@/sanity/lib/client'
import { HOME_QUERY } from '@/sanity/lib/queries'
import type { TalentCard } from '@/sanity/lib/types'

type Home = { heroTitle?: string; heroSubtitle?: string; featured?: TalentCard[] } | null

export default async function HomePage() {
  const home = await sanityFetch<Home>(HOME_QUERY, {}, null, ['homePage'])

  return (
    <>
      {/* Experiential hero — motion + interaction defined in Figma page "07 Motion & Interactions" */}
      <section className="flex min-h-[85dvh] flex-col justify-end gap-6 px-5 pb-16 md:px-10">
        <h1 className="text-[18vw] font-bold leading-[0.85] tracking-tighter md:text-[14vw]">
          {home?.heroTitle || 'INCH”'}
        </h1>
        <p className="max-w-xl text-lg text-muted">{home?.heroSubtitle || 'Model management.'}</p>
      </section>

      <section className="grid grid-cols-1 border-y border-line md:grid-cols-2">
        <Link href="/women" className="flex aspect-[4/3] items-end p-8 text-4xl font-bold md:border-r md:border-line">
          INCH” Women
        </Link>
        <Link href="/men" className="flex aspect-[4/3] items-end p-8 text-4xl font-bold">
          DOT. Men
        </Link>
      </section>

      {!!home?.featured?.length && (
        <section className="px-5 py-16 md:px-10">
          <h2 className="mb-8 text-sm uppercase tracking-wide text-muted">Featured</h2>
          <TalentGrid talents={home.featured} />
        </section>
      )}
    </>
  )
}
