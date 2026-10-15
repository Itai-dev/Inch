import type { Metadata } from 'next'
import { HomeView } from '@/components/home/HomeView'
import type { Site } from '@/lib/sites'

export const metadata: Metadata = { title: 'Logo opening (test)', robots: { index: false, follow: false } }

/** The home page with the alternative opening: the ” grows and the video starts inside it (INCH” only). */
export default async function LogoTestPage({ params }: PageProps<'/[site]/logotest'>) {
  return <HomeView site={(await params).site as Site} hero="grow" />
}
