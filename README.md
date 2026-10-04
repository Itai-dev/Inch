# INCH” — Website

Next.js 16 (App Router) + Sanity Studio (embedded at `/studio`). Deploy target: Vercel.

## Setup

1. `npm install`
2. Create a Sanity project → https://www.sanity.io/manage (dataset `production`).
3. Copy `.env.example` → `.env.local` and fill in:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `SANITY_API_WRITE_TOKEN` (API → Tokens → Editor) — needed for shared selections + applications
4. In Sanity → API → CORS origins add `http://localhost:3000` and the production URL (with credentials).
5. `npm run dev` → site at `localhost:3000`, CMS at `localhost:3000/studio`.

The site builds and runs before Sanity is connected (pages render empty states).

## Two sites: INCH” and DOT.

INCH” (women) and DOT. (men) are separate sites in one app — own logo, theme, models, apply funnel, contact details and selections.

- INCH” → `/…`, DOT. → `/dot/…`. Every page lives under `src/app/[site]`; `src/proxy.ts` rewrites INCH” URLs to `/inch/…`.
- Site config (brand, division, base path): `src/lib/sites.ts`. Link with `sitePath(site, '/apply')` / `talentPath(talent)`.
- To give DOT. its own domain later, rewrite by host in `src/proxy.ts`.

## Routes (on each site; DOT. prefixed with `/dot`)

| Route | What |
|---|---|
| `/` | Home: statement reveal, featured carousel, models |
| `/models`, `/models/[category]` | Board + category tabs |
| `/talent/[slug]` | Model profile (a DOT. model on the INCH” URL redirects to DOT.) |
| `/s/[shareId]` | Shared talent selection (client view, noindex) |
| `/apply` | Smart Apply funnel — women on INCH”, men on DOT. |
| `/contact`, `/privacy`, `/accessibility` | Static pages (contact from that site's Site settings) |
| `/studio/inch`, `/studio/dot` | Sanity Studio workspaces |

```
src/
  app/[site]/              both public sites
  app/api/selection        POST → creates a shared selection in Sanity
  app/api/apply            POST → validates, re-screens, uploads digitals, creates application
  components/              Header/Footer (per site), TalentCard, selection/*, apply/*
  lib/sites.ts             INCH” / DOT. config + URL helpers
  lib/apply-criteria.ts    pre-screen rules (PLACEHOLDERS — confirm with INCH”)
  sanity/                  env, client, queries, schemaTypes, desk structure
sanity.config.ts           Studio config (one workspace per site)
```

## Brand + motion

- Tokens in `src/app/globals.css` (ink/paper + grey/stone, Archivo variable). The DOT. site renders with `<html data-theme="dot">` (set in `src/app/[site]/layout.tsx`).
- The logo may still change — it's drawn only in `src/components/brand/Logo.tsx` (`--wordmark-stretch` controls the condensed width).
- Marks: `src/components/brand/Marks.tsx` (” strokes from the brand file, ■). Pattern: `Pattern.tsx`.

| | INCH” (women) | DOT. (men) |
|---|---|---|
| Statement | `TextOpen` — ” splits, char fade reveal (home) | `DotStatement` — ■ cursor jumps word by word, lands as the full stop (home) |
| Carousel | `TapeCarousel` — measuring-tape ruler strip | `DotIndexCarousel` — single image, ■ aperture wipe, square index |
| Reveal | `BlinkOpen` — ” blinks 3×, opens image (profile) | `DotOpen` — ■ pulses, square aperture opens (profile) |

All respect `prefers-reduced-motion`. Review them with placeholder images at **/motion-lab** (noindex).

## CMS content model

The Studio has two workspaces (switcher top-left): **INCH”** at `/studio/inch` and **DOT.** at `/studio/dot`. Same dataset; each workspace only lists its own division's models, categories, applications and shared selections, and new documents are created in that division.

talent · category · application · selection (filtered by `division`) · homePage + siteSettings (one each per site: `homePage-inch`, `homePage-dot`, `siteSettings-inch`, `siteSettings-dot`).

## Open items

- [ ] Apply criteria (age/height ranges per division) — agree with INCH”
- [ ] Application email notification (Resend or similar) — `src/app/api/apply/route.ts`
- [ ] Final logo SVGs (INCH” + DOT.) → `Logo.tsx`
- [ ] Final DOT. statement copy (Studio → DOT. → Home page)
- [ ] Privacy + accessibility copy (IS 5568)
- [ ] Analytics + cookie consent, depending on tools chosen
- [ ] Bot protection on `/api/apply` and `/api/selection` (Turnstile / rate limit)

## Design

- FigJam — sitemap, flows, data model: https://www.figma.com/board/UwD388Mbv6qoidrbemxBRv
- Figma — website design file: https://www.figma.com/design/PFi6i4hKyq2I9y6fmIdDyI
- Brand — https://www.figma.com/design/hriN1CraUpyEZQuIrGa0w9
- Motion prototypes (Figma Make): text open, tape-measure carousel, blink-open image
