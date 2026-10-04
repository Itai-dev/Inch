import type { MetadataRoute } from 'next'
import { siteUrl } from '@/sanity/env'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/studio', '/s/', '/dot/s/', '/api/', '/motion-lab', '/dot/motion-lab'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
