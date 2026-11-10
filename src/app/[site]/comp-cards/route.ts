import { compCardsPdf, type CardsMode } from '@/lib/comp-card'
import { siteForDivision, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { TALENTS_FULL_BY_IDS_QUERY } from '@/sanity/lib/queries'
import { getSettings } from '@/sanity/lib/settings'
import type { Talent } from '@/sanity/lib/types'

/**
 * The selection as one PDF: a comp card a model, in the order chosen (`?ids=a,b,c`). Each card
 * links to the model's page on the site. `&polaroids=with` follows each card with the model's
 * polaroids; `&polaroids=only` is the polaroids alone.
 */
export async function GET(req: Request, { params }: RouteContext<'/[site]/comp-cards'>) {
  const site = (await params).site as Site
  const url = new URL(req.url)
  const ids = (url.searchParams.get('ids') ?? '').split(',').filter(Boolean).slice(0, 40)
  const found = ids.length ? await sanityFetch<Talent[]>(TALENTS_FULL_BY_IDS_QUERY, { ids }, [], ['talent']) : []
  // In the selection's order, and only this site's models (placeholders aren't in the Studio).
  const which = url.searchParams.get('polaroids')
  const mode: CardsMode = which === 'only' ? 'polaroids' : which === 'with' ? 'with-polaroids' : 'cards'
  const talents = ids
    .map((id) => found.find((t) => t._id === id))
    .filter((t): t is Talent => !!t && siteForDivision(t.division) === site)
  if (!talents.length) return new Response(mode === 'polaroids' ? 'No polaroids for this selection yet.' : 'No comp cards for this selection yet.', { status: 404 })
  const { contact } = await getSettings(site)

  const bytes = await compCardsPdf(talents, site, contact, url.origin, mode)
  const name = `${talents.length === 1 ? talents[0].slug : `${site}-selection`}-${mode === 'polaroids' ? 'polaroids' : mode === 'with-polaroids' ? 'comp-cards-polaroids' : 'comp-cards'}`
  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${name}.pdf"`,
      'cache-control': 'private, no-store',
    },
  })
}
