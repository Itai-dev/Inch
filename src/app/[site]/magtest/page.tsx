import type { Metadata } from 'next'
import { HomeView } from '@/components/home/HomeView'
import type { Site } from '@/lib/sites'

export const metadata: Metadata = { title: 'Magazine over the statement (test)', robots: { index: false, follow: false } }

/** The home page with the magazine landing on the statement: the statement stays under it while the pages turn, and they scroll away together (INCH” only). */
export default async function MagazineTestPage({ params }: PageProps<'/[site]/magtest'>) {
  return <HomeView site={(await params).site as Site} magazine="together" />
}
