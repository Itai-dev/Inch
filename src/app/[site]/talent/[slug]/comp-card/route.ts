import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from 'pdf-lib'
import { LEFT_PATH, RIGHT_PATH } from '@/components/brand/Marks'
import { singletonId, siteForDivision, SITES, type Site } from '@/lib/sites'
import { cmToFeet, cmToInches } from '@/lib/units'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { SITE_SETTINGS_QUERY, TALENT_QUERY } from '@/sanity/lib/queries'
import type { SanityImage, SiteSettings, Talent } from '@/sanity/lib/types'

/**
 * Comp card: A4 landscape. Cover on the left, four book images on the right,
 * name + measurements (cm and inches) + agency contact along the bottom.
 */
const W = 842
const H = 595
const M = 28
const FOOT = 92
const INK = rgb(0.04, 0.04, 0.04)
const MUTED = rgb(0.43, 0.43, 0.43)

export async function GET(_req: Request, { params }: RouteContext<'/[site]/talent/[slug]/comp-card'>) {
  const { site, slug } = await params
  const t = await sanityFetch<Talent | null>(TALENT_QUERY, { slug }, null, ['talent'])
  if (!t || siteForDivision(t.division) !== (site as Site)) return new Response('Not found', { status: 404 })
  const settings = await sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, { id: singletonId('siteSettings', site as Site) }, null, ['siteSettings'])

  const pdf = await PDFDocument.create()
  pdf.setTitle(`${t.name} — comp card`)
  const page = pdf.addPage([W, H])
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)

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

  text(t.name.toUpperCase(), M, FOOT - 36, 24, bold)
  const m = t.measurements ?? {}
  const rows: [string, string | undefined][] = [
    ['HEIGHT', m.height ? `${m.height} / ${ascii(cmToFeet(m.height))}` : undefined],
    [t.division === 'men' ? 'CHEST' : 'BUST', m.bust ? `${m.bust} / ${ascii(cmToInches(m.bust))}` : undefined],
    ['WAIST', m.waist ? `${m.waist} / ${ascii(cmToInches(m.waist))}` : undefined],
    ['HIPS', m.hips ? `${m.hips} / ${ascii(cmToInches(m.hips))}` : undefined],
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
    page.drawText(v, { x: W - M - font.widthOfTextAtSize(v, size), y, size, font, color })
  }
  // Agency mark (” or ■), not the full wordmark — top-aligned with the name's cap height.
  const markH = 18
  const markTop = FOOT - 36 + 17
  if (SITES[site as Site].division === 'men') {
    page.drawRectangle({ x: W - M - markH * 0.7, y: markTop - markH * 0.7, width: markH * 0.7, height: markH * 0.7, color: INK })
  } else {
    const k = markH / 611
    for (const d of [LEFT_PATH, RIGHT_PATH]) page.drawSvgPath(d, { x: W - M - 1268 * k, y: markTop + 235 * k, scale: k, color: INK })
  }
  const contact = [settings?.email, settings?.phone, settings?.instagram?.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')]
  right(contact.filter(Boolean).join('   '), FOOT - 70, 8, regular, MUTED)

  const bytes = await pdf.save()
  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${slug}-comp-card.pdf"`,
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  })
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
