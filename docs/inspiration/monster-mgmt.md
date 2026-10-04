# Inspiration — Monster Management

**Site:** https://www.monster-mgmt.com (start at `/menu`)
**Analysed:** October 2026
**Built on:** Mediaslide (agency SaaS), Next.js + Tailwind

What a top-tier agency site does well, and what INCH” takes from it. We steal ideas, not their look: everything is rebuilt in our own brand (Archivo condensed, ” and ■, INCH”/DOT. motion). No Monster images or copy live in this repo.

---

## 1. Navigation

- **Home `/`:** a black splash with the logo; click → menu. There is no real homepage.
- **Menu `/menu`:** full-screen black overlay. MILANO / MADRID / PARIS / MEN in huge extended bold caps, right-aligned. Bottom-left: search, Instagram, DIARY, SUBMIT, INFORMATION.
- **City `/it/models`:** header city switcher (Milano · Madrid · Paris), then that city's boards: **Mnstr / Mgmt / Youth**.
- **Men `/eu/men`:** one Europe-wide board; each model is tagged "Represented in: Italy / France…".
- Diary / Submit / Information exist once per city (`/it/news`, `/es/application`, …).

## 2. Page system

| Page | URL | What's on it |
|---|---|---|
| Board | `/it/models/mnstr` | A–Z grid, tall images (3.1:4), name underneath. Nothing else. |
| Profile — book | `/it/models/mnstr/1289-sun-mizrahi` | Full-screen book viewer (see §3) |
| Profile — other book | `…/p/12711` | e.g. COVERS+ADS |
| Profile — bio | `…?bio=bio` | Bio text |
| Diary | `/es/news` | 2-col cover grid, filters ALL / EDITORIAL / CAMPAIGN / DOSSIER; card = model · publication · date |
| Diary story | `/es/news/236-d-repubblica-october-2026` | Story detail |
| Submit | `/es/application` | Application form (§4) |
| Information | `/es/information` | Offices (Milan / Madrid / Paris / Men), departments (Scouting / Creative / Financial), short about |
| Search | `/search` | Model search by name |
| Footer | — | Address, privacy + cookie PDFs, Mediaslide credit |

## 3. Profile viewer

- Images shown as **spreads**: two side by side, horizontal scroll-snap, page counter on the right.
- **Credits on every image:** `HARPER'S BAZAAR IT / photographer DANIEL JACKSON / stylist PAUL SINCLAIRE`.
- Name large, bottom-left. Tabs: **MODELBOOK · COVERS+ADS · BIO · IG · TIKTOK**.
- Bottom-right: **THUMBNAILS** (grid view) and **PDF** (download book).
- ◐ light/dark toggle top-left; ✕ top-right returns to the board.
- Measurements in **cm and inches** side by side (Height 184 · 6′0½″).

## 4. Submit form

Gender · first + last name · **birthdate** · city · email · mobile · Instagram · **TikTok** · height · bust · waist · hips · hair · eyes · shoes · **4 photo slots** · 3 consents (privacy, 16+ or guardian approval, data kept for 30 working days).

---

## Steal like an artist

### Take (and make ours)

1. **The menu as a statement.** Their menu *is* the brand: giant type, nothing else. Ours: a full-screen INCH” / DOT. menu — the ” splits to open it on INCH”, a ■ wipes it in on DOT. Two words, huge, in our condensed wordmark.
2. **Credits on every image.** In fashion, the photographer, stylist and publication are proof of level. Add `publication / photographer / stylist` to each image in the CMS and show it as a quiet caption.
3. **More than one book per model.** Modelbook · Covers + Ads · Polaroids (· Video later). Each is a tab, each has its own URL so bookers can send exactly the right one.
4. **The booker's tools.** A thumbnails toggle (see the whole book at once) and a **PDF comp card** download. Bookers use these every day; they matter more than animation.
5. **Board restraint.** Image + name, A–Z, nothing else. Our TalentCard already is close — keep it that way and resist adding badges.
6. **Profile as an overlay with ✕.** Closing returns you to the same place on the board. Browsing many models feels fast.
7. **Dual units.** cm and inches side by side (or a toggle). Clients are international; it also removes conversion mistakes in the CMS.
8. **A Diary that feeds the models.** Editorial / Campaign posts that link to the model, and each profile shows that model's latest stories. Content that keeps the site alive between new signings.
9. **Boards as curation tiers.** Their Mnstr / Mgmt / Youth = main board / established / development. Our categories can do the same (e.g. Main · New faces).
10. **Submit details:** birthdate instead of age (exact, and handles minors properly), a TikTok field, and named photo slots (close-up, profile, full length, free choice) instead of one multi-upload.

### Leave

- **Splash home with no content.** Bad for SEO and first impressions — our home statement + carousel is better.
- **Legal pages as PDFs.** Not accessible; keep ours as pages (needed for IS 5568).
- **A light/dark toggle.** For us the theme *is* the brand: INCH” light, DOT. dark.
- **The cookie wall of capital letters.** Use a short, quiet consent bar if we need one.
- **Generic SaaS feel and client-side errors** (several Monster pages crash without JavaScript). Ours renders on the server.
- **Multi-city "Represented in".** Not relevant to a single-city agency.
