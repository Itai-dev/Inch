import { PDFArray, PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'
import { LEFT_PATH, RIGHT_PATH } from '@/components/brand/Marks'
import { DEMO_CONTACT } from '@/lib/copy'
import { SITES, talentPath, type Site } from '@/lib/sites'
import { cmToFeet, cmToInches } from '@/lib/units'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, SiteSettings, Talent } from '@/sanity/lib/types'

/**
 * Comp cards as a PDF: A4 landscape, a page a model. Cover on the left, four book images on the
 * right; the name, measurements (cm and inches) and the agency's contact along the bottom. The
 * name and a "View online" line link to the model's page on the site, so the card is a way in.
 * With polaroids, each model's polaroids follow her card (or stand alone): eight a page, laid out as
 * the card's pictures, under her name.
 */
const W = 842
const H = 595
const M = 28
const FOOT = 92
const INK = rgb(0.04, 0.04, 0.04)
const MUTED = rgb(0.43, 0.43, 0.43)
/** The model's name, in points. */
const NAME_PT = 24

/** What goes in: the comp cards, the cards each followed by the model's polaroids, or the polaroids alone. */
export type CardsMode = 'cards' | 'with-polaroids' | 'polaroids'

/** The models' polaroids that can be drawn. */
export const polaroidsOf = (t: Talent) => (t.polaroids ?? []).filter((i) => i.asset)

/** One PDF with a comp card (and/or polaroids) for each model, in order. `origin` makes the links absolute. */
export async function compCardsPdf(talents: Talent[], site: Site, settings: SiteSettings | null, origin: string, mode: CardsMode = 'cards') {
  const pdf = await PDFDocument.create()
  const what = mode === 'polaroids' ? 'polaroids' : talents.length === 1 ? 'comp card' : 'comp cards'
  pdf.setTitle(talents.length === 1 ? `${talents[0].name} — ${what}` : `${SITES[site].brand} — ${what}`)
  const fonts = { bold: await pdf.embedFont(StandardFonts.HelveticaBold), regular: await pdf.embedFont(StandardFonts.Helvetica) }
  for (const t of talents) {
    if (mode !== 'polaroids') await drawCard(pdf, fonts, t, site, settings, origin)
    if (mode !== 'cards') await drawPolaroids(pdf, fonts, t, site, origin)
  }
  return pdf.save()
}

const POLS_PER_PAGE = 8

async function drawPolaroids(pdf: PDFDocument, { bold }: { bold: PDFFont; regular: PDFFont }, t: Talent, site: Site, origin: string) {
  const all = polaroidsOf(t)
  if (!all.length) return
  const url = `${origin}${talentPath(t)}/polaroids`
  const pages = Math.ceil(all.length / POLS_PER_PAGE)
  for (let pg = 0; pg < pages; pg++) {
    const page = pdf.addPage([W, H])
    const items = all.slice(pg * POLS_PER_PAGE, (pg + 1) * POLS_PER_PAGE)
    // As the card's pictures: 3:4, cropped, four across and two down, a short last row centred.
    const areaH = H - M - FOOT
    const gap = 8
    const cellH = (areaH - gap) / 2
    const cellW = Math.min((cellH * 3) / 4, (W - 2 * M - gap * 3) / 4)
    const imgs = await Promise.all(items.map((img) => embed(pdf, img, cellW, cellH)))
    ;[items.slice(0, 4), items.slice(4)].forEach((row, r) => {
      const x0 = (W - (row.length * cellW + (row.length - 1) * gap)) / 2
      const y = H - M - (r + 1) * cellH - r * gap
      row.forEach((_, c) => {
        const img = imgs[r * 4 + c]
        if (img) page.drawImage(img, { x: x0 + c * (cellW + gap), y, width: cellW, height: cellH })
      })
    })
    // Foot: her name and "Polaroids", the agency's mark, and the way to them online.
    const base = FOOT - 36
    const name = safe(t.name.toUpperCase(), bold)
    page.drawText(name, { x: M, y: base, size: NAME_PT, font: bold, color: INK })
    link(pdf, page, [M, base - 4, M + bold.widthOfTextAtSize(name, NAME_PT), base + 20], url)
    page.drawText(pages > 1 ? `POLAROIDS  ${pg + 1} / ${pages}` : 'POLAROIDS', { x: M, y: FOOT - 64, size: 9, font: bold, color: INK })
    drawMark(page, site)
    const view = safe(`VIEW ONLINE  ${url.replace(/^https?:\/\//, '')}`, bold)
    const vw = bold.widthOfTextAtSize(view, 8)
    page.drawText(view, { x: W - M - vw, y: FOOT - 58, size: 8, font: bold, color: INK })
    link(pdf, page, [W - M - vw, FOOT - 61, W - M, FOOT - 50], url)
  }
}

/** The agency's mark (” or ■) at the foot's right, top-aligned with the name's cap height. */
function drawMark(page: PDFPage, site: Site) {
  const markH = 18
  const markTop = FOOT - 36 + 17
  if (SITES[site].division === 'men') {
    page.drawRectangle({ x: W - M - markH * 0.7, y: markTop - markH * 0.7, width: markH * 0.7, height: markH * 0.7, color: INK })
  } else {
    const k = markH / 72 // brand ” is 64×72
    for (const d of [LEFT_PATH, RIGHT_PATH]) page.drawSvgPath(d, { x: W - M - 64 * k, y: markTop, scale: k, color: INK })
  }
}

async function drawCard(pdf: PDFDocument, { bold, regular }: { bold: PDFFont; regular: PDFFont }, t: Talent, site: Site, settings: SiteSettings | null, origin: string) {
  const page = pdf.addPage([W, H])

  // Images: cover left (3:4), 2×2 grid right.
  const areaH = H - M - FOOT
  const coverW = Math.round((areaH * 3) / 4)
  const gap = 8
  const gridX = M + coverW + gap
  const cellW = (W - M - gridX - gap) / 2
  const cellH = (areaH - gap) / 2
  const book = [...(t.portfolio ?? []), ...(t.coversAds ?? [])].filter((i) => i.asset)
  const coverSrc = t.cover?.asset ? t.cover : book[0]
  const rest = book.filter((i) => i.asset?._ref !== coverSrc?.asset?._ref).slice(0, 4)

  const [coverImg, ...gridImgs] = await Promise.all(
    [coverSrc, ...rest].map((img, k) => (img ? embed(pdf, img, k === 0 ? coverW : cellW, k === 0 ? areaH : cellH) : null)),
  )
  if (coverImg) page.drawImage(coverImg, { x: M, y: FOOT, width: coverW, height: areaH })
  gridImgs.forEach((img, k) => {
    if (!img) return
    const col = k % 2
    const row = Math.floor(k / 2)
    page.drawImage(img, { x: gridX + col * (cellW + gap), y: FOOT + (1 - row) * (cellH + gap), width: cellW, height: cellH })
  })

  // Footer: name, measurements, agency.
  const text = (s: string, x: number, y: number, size: number, font: PDFFont, color = INK) =>
    page.drawText(safe(s, font), { x, y, size, font, color })

  const url = origin + talentPath(t)
  const name = safe(t.name.toUpperCase(), bold)
  const nameW = bold.widthOfTextAtSize(name, NAME_PT)
  const base = FOOT - 36
  // The name on its own; the agency's mark stands at the right.
  text(name, M, base, NAME_PT, bold)
  const end = M + nameW
  link(pdf, page, [M, base - 4, end, base + 20], url)

  // As on the site: the label regular and muted, the value bold.
  const m = t.measurements ?? {}
  const rows: [string, string | undefined][] = [
    ['HEIGHT', m.height ? `${m.height} cm / ${ascii(cmToFeet(m.height))}` : undefined],
    [t.division === 'men' ? 'CHEST' : 'BUST', m.bust ? `${m.bust} cm / ${ascii(cmToInches(m.bust))}` : undefined],
    ['WAIST', m.waist ? `${m.waist} cm / ${ascii(cmToInches(m.waist))}` : undefined],
    ['HIPS', m.hips ? `${m.hips} cm / ${ascii(cmToInches(m.hips))}` : undefined],
    ['SHOES', m.shoes ? `${m.shoes} EU` : undefined],
    ['HAIR', m.hair?.toUpperCase()],
    ['EYES', m.eyes?.toUpperCase()],
  ]
  let x = M
  for (const [k, v] of rows.filter(([, v]) => v)) {
    text(k, x, FOOT - 58, 7, regular, MUTED)
    text(v!, x, FOOT - 70, 9, bold)
    x += Math.max(bold.widthOfTextAtSize(safe(v!, bold), 9), regular.widthOfTextAtSize(k, 7)) + 18
  }

  const right = (s: string, y: number, size: number, font: PDFFont, color = INK) => {
    const v = safe(s, font)
    const w = font.widthOfTextAtSize(v, size)
    page.drawText(v, { x: W - M - w, y, size, font, color })
    return w
  }
  // Agency mark (” or ■), not the full wordmark.
  drawMark(page, site)
  // The way back to her page, then the agency's contact.
  const viewW = right(`VIEW ONLINE  ${url.replace(/^https?:\/\//, '')}`, FOOT - 58, 8, bold)
  link(pdf, page, [W - M - viewW, FOOT - 61, W - M, FOOT - 50], url)
  // As on the site: the Studio's details, else the demo ones until they're set.
  const contact = [settings?.email || DEMO_CONTACT.email, settings?.phone || DEMO_CONTACT.phone, (settings?.instagram || DEMO_CONTACT.instagram).replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')]
  right(contact.filter(Boolean).join('   '), FOOT - 72, 8, regular, MUTED)
}

/** A clickable area on the page, opening `url`. */
function link(pdf: PDFDocument, page: PDFPage, rect: [number, number, number, number], url: string) {
  const annot = pdf.context.register(
    pdf.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: rect,
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
    }),
  )
  const annots = page.node.lookup(PDFName.of('Annots'))
  if (annots instanceof PDFArray) annots.push(annot)
  else page.node.set(PDFName.of('Annots'), pdf.context.obj([annot]))
}

/** Fetch a Sanity image cropped (hotspot-aware) to the box, as JPEG. */
async function embed(pdf: PDFDocument, img: SanityImage, w: number, h: number): Promise<PDFImage | null> {
  const url = urlFor(img).width(Math.round(w * 2.5)).height(Math.round(h * 2.5)).fit('crop').format('jpg').quality(85).url()
  const res = await fetch(url, { headers: { accept: 'image/jpeg' } }).catch(() => null)
  if (!res?.ok) return null
  const buf = new Uint8Array(await res.arrayBuffer())
  if (buf[0] === 0xff && buf[1] === 0xd8) return pdf.embedJpg(buf)
  if (buf[0] === 0x89 && buf[1] === 0x50) return pdf.embedPng(buf)
  return null
}

/** Standard PDF fonts only cover Latin-1: drop accents, skip anything else. */
function safe(s: string, font: PDFFont) {
  return [...s.normalize('NFD').replace(/[̀-ͯ]/g, '')]
    .filter((ch) => {
      try {
        font.encodeText(ch)
        return true
      } catch {
        return false
      }
    })
    .join('')
}

const ascii = (s: string) => s.replace('′', "'").replace('″', '"')
