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
 */
const W = 842
const H = 595
const M = 28
const FOOT = 92
const INK = rgb(0.04, 0.04, 0.04)
const MUTED = rgb(0.43, 0.43, 0.43)

/** One PDF with a comp card for each model, in order. `origin` makes the links absolute. */
export async function compCardsPdf(talents: Talent[], site: Site, settings: SiteSettings | null, origin: string) {
  const pdf = await PDFDocument.create()
  pdf.setTitle(talents.length === 1 ? `${talents[0].name} — comp card` : `${SITES[site].brand} — comp cards`)
  const fonts = { bold: await pdf.embedFont(StandardFonts.HelveticaBold), regular: await pdf.embedFont(StandardFonts.Helvetica) }
  for (const t of talents) await drawCard(pdf, fonts, t, site, settings, origin)
  return pdf.save()
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
  text(name, M, FOOT - 36, 24, bold)
  link(pdf, page, [M, FOOT - 40, M + bold.widthOfTextAtSize(name, 24), FOOT - 36 + 20], url)

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
  // Agency mark (” or ■), not the full wordmark — top-aligned with the name's cap height.
  const markH = 18
  const markTop = FOOT - 36 + 17
  if (SITES[site].division === 'men') {
    page.drawRectangle({ x: W - M - markH * 0.7, y: markTop - markH * 0.7, width: markH * 0.7, height: markH * 0.7, color: INK })
  } else {
    const k = markH / 72 // brand ” is 64×72
    for (const d of [LEFT_PATH, RIGHT_PATH]) page.drawSvgPath(d, { x: W - M - 64 * k, y: markTop, scale: k, color: INK })
  }
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
