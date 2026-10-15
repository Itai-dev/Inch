import { compCardsPdf } from '@/lib/comp-card'
import { singletonId, siteForDivision, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { SITE_SETTINGS_QUERY, TALENT_QUERY } from '@/sanity/lib/queries'
import type { SiteSettings, Talent } from '@/sanity/lib/types'

/** A model's comp card as a PDF (see `compCardsPdf`). */
export async function GET(req: Request, { params }: RouteContext<'/[site]/talent/[slug]/comp-card'>) {
  const { site, slug } = await params
  const t = await sanityFetch<Talent | null>(TALENT_QUERY, { slug }, null, ['talent'])
  if (!t || siteForDivision(t.division) !== (site as Site)) return new Response('Not found', { status: 404 })
  const settings = await sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, { id: singletonId('siteSettings', site as Site) }, null, ['siteSettings'])

  const bytes = await compCardsPdf([t], site as Site, settings, new URL(req.url).origin)
  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${slug}-comp-card.pdf"`,
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  })
}
