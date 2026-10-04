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

## Routes

| Route | What |
|---|---|
| `/` | Experiential home (hero, INCH”/DOT. split, featured) |
| `/women`, `/men` | Division index (INCH” women / DOT. men) + category tabs |
| `/[division]/[category]` | Category board |
| `/talent/[slug]` | Model profile: portfolio, polaroids, measurements, bio, Instagram |
| `/s/[shareId]` | Shared talent selection (client view, noindex) |
| `/apply` | Smart Apply funnel |
| `/contact`, `/privacy`, `/accessibility` | Static pages |
| `/studio` | Sanity Studio |

```
src/
  app/(site)/              public site pages
  app/api/selection        POST → creates a shared selection in Sanity
  app/api/apply            POST → validates, re-screens, uploads digitals, creates application
  components/              TalentCard, Measurements, selection/*, apply/*
  lib/apply-criteria.ts    pre-screen rules (PLACEHOLDERS — confirm with INCH”)
  sanity/                  env, client, queries, schemaTypes, desk structure
sanity.config.ts           Studio config
```

## CMS content model

talent · category · homePage (singleton) · siteSettings (singleton) · selection · application.
The Studio desk is split into **INCH” — Women** and **DOT. — Men**, plus Applications and Shared selections.

## Open items

- [ ] Apply criteria (age/height ranges per division) — agree with INCH”
- [ ] Application email notification (Resend or similar) — `src/app/api/apply/route.ts`
- [ ] Brand tokens + typefaces (`globals.css`, `next/font/local`) after design approval
- [ ] Home motion / interactions (Figma page "07 Motion & Interactions")
- [ ] Contact details from Site settings; privacy + accessibility copy (IS 5568)
- [ ] Analytics + cookie consent, depending on tools chosen
- [ ] Bot protection on `/api/apply` and `/api/selection` (Turnstile / rate limit)

## Design

- FigJam — sitemap, flows, data model: https://www.figma.com/board/piyV1DY1LZ8NmFw5MGyCCP
- Figma — website design file: https://www.figma.com/design/uVfIacDlOrV4vnZqga6h56
