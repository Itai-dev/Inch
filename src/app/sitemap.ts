import type { MetadataRoute } from 'next'
import { siteForDivision, sitePath, SITE_KEYS, talentPath } from '@/lib/sites'
import { siteUrl } from '@/sanity/env'
import { sanityFetch } from '@/sanity/lib/client'
import { ALL_SLUGS_QUERY } from '@/sanity/lib/queries'
import type { Division } from '@/sanity/lib/types'

type Slugs = {
  talents: { slug: string; division: Division; _updatedAt: string }[]
  categories: { slug: string; division: Division; _updatedAt: string }[]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { talents, categories } = await sanityFetch<Slugs>(ALL_SLUGS_QUERY, {}, { talents: [], categories: [] })
  const staticPaths = ['/', '/models', '/apply', '/contact', '/privacy', '/accessibility']
  return [
    ...SITE_KEYS.flatMap((site) => staticPaths.map((p) => ({ url: `${siteUrl}${sitePath(site, p)}` }))),
    ...categories.map((c) => ({
      url: `${siteUrl}${sitePath(siteForDivision(c.division), `/models/${c.slug}`)}`,
      lastModified: c._updatedAt,
    })),
    ...talents.filter((t) => t.division).map((t) => ({ url: `${siteUrl}${talentPath(t)}`, lastModified: t._updatedAt })),
  ]
}
