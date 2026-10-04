import type { MetadataRoute } from 'next'
import { siteUrl } from '@/sanity/env'
import { sanityFetch } from '@/sanity/lib/client'
import { ALL_SLUGS_QUERY } from '@/sanity/lib/queries'

type Slugs = {
  talents: { slug: string; _updatedAt: string }[]
  categories: { slug: string; division: string; _updatedAt: string }[]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { talents, categories } = await sanityFetch<Slugs>(ALL_SLUGS_QUERY, {}, { talents: [], categories: [] })
  const staticPaths = ['', '/women', '/men', '/apply', '/contact', '/privacy', '/accessibility']
  return [
    ...staticPaths.map((p) => ({ url: `${siteUrl}${p}` })),
    ...categories.map((c) => ({ url: `${siteUrl}/${c.division}/${c.slug}`, lastModified: c._updatedAt })),
    ...talents.map((t) => ({ url: `${siteUrl}/talent/${t.slug}`, lastModified: t._updatedAt })),
  ]
}
