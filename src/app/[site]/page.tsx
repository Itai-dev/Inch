import { HomeView } from '@/components/home/HomeView'
import type { Site } from '@/lib/sites'

export default async function HomePage({ params }: PageProps<'/[site]'>) {
  return <HomeView site={(await params).site as Site} />
}
