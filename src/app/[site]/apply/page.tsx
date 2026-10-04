import type { Metadata } from 'next'
import { ApplyFunnel } from '@/components/apply/ApplyFunnel'
import { sitePath, SITES, type Site } from '@/lib/sites'

export async function generateMetadata({ params }: PageProps<'/[site]/apply'>): Promise<Metadata> {
  const site = (await params).site as Site
  return { title: 'Become a model', alternates: { canonical: sitePath(site, '/apply') } }
}

export default async function ApplyPage({ params }: PageProps<'/[site]/apply'>) {
  const site = (await params).site as Site
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-16">
      <div className="flex flex-col gap-3">
        <p className="label text-muted">{SITES[site].brand} {SITES[site].label}</p>
        <h1 className="text-6xl font-bold tracking-tight">Become a model</h1>
      </div>
      <ApplyFunnel site={site} />
    </div>
  )
}
