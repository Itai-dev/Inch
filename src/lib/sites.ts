import type { Division } from '@/sanity/lib/types'

/**
 * INCH” (women) and DOT. (men) are two separate sites in one app.
 * INCH” lives at `/`, DOT. at `/dot`. Internally every page sits under `app/[site]`;
 * `src/proxy.ts` rewrites INCH” URLs to `/inch/…`.
 */
export type Site = 'inch' | 'dot'

export const SITES: Record<
  Site,
  { division: Division; brand: string; label: string; base: string; description: string }
> = {
  inch: {
    division: 'women',
    brand: 'INCH”',
    label: 'Women',
    base: '',
    description:
      'Inch is a boutique modeling agency representing distinctive talent, curated with a precise eye for fashion and image.',
  },
  dot: {
    division: 'men',
    brand: 'DOT.',
    label: 'Men',
    base: '/dot',
    description: 'DOT. — the men’s board of INCH” Model Management.',
  },
}

export const SITE_KEYS = Object.keys(SITES) as Site[]

export const isSite = (v: string): v is Site => v === 'inch' || v === 'dot'

export const siteForDivision = (d: Division): Site => (d === 'men' ? 'dot' : 'inch')

/** Public URL path for a page on a site, e.g. sitePath('dot', '/apply') → '/dot/apply'. */
export const sitePath = (site: Site, path = '/') => SITES[site].base + (path === '/' && SITES[site].base ? '' : path)

export const talentPath = (t: { division: Division; slug: string }) => sitePath(siteForDivision(t.division), `/talent/${t.slug}`)

/** Sanity singleton IDs are per site: `homePage-inch`, `siteSettings-dot`, … */
export const singletonId = (type: 'homePage' | 'siteSettings', site: Site) => `${type}-${site}`
