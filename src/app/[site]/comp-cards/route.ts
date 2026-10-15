import { compCardsPdf } from '@/lib/comp-card'
import { singletonId, siteForDivision, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { SITE_SETTINGS_QUERY, TALENTS_FULL_BY_IDS_QUERY } from '@/sanity/lib/queries'
import type { SiteSettings, Talent } from '@/sanity/lib/types'

/**
 * The selection as one PDF: a comp card a model, in the order chosen (`?ids=a,b,c`). Each card
 * links to the model's page on the site.
 */
export async function GET(req: Request, { params }: RouteContext<'/[site]/comp-cards'>) {
  const site = (await params).site as Site
  const url = new URL(req.url)
  const ids = (url.searchParams.get('ids') ?? '').split(',').filter(Boolean).slice(0, 40)
  const found = ids.length ? await sanityFetch<Talent[]>(TALENTS_FULL_BY_IDS_QUERY, { ids }, [], ['talent']) : []
  // In the selection's order, and only this site's models (placeholders aren't in the Studio).
  const talents = ids.map((id) => found.find((t) => t._id === id)).filter((t): t is Talent => !!t && siteForDivision(t.division) === site)
  if (!talents.length) return new Response('No comp cards for this selection yet.', { status: 404 })
  const settings = await sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, { id: singletonId('siteSettings', site) }, null, ['siteSettings'])

  const bytes = await compCardsPdf(talents, site, settings, url.origin)
  const name = talents.length === 1 ? talents[0].slug : `${site}-selection`
  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${name}-comp-cards.pdf"`,
      'cache-control': 'private, no-store',
    },
  })
}
