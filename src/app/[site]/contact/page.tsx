import type { Metadata } from 'next'
import { PrintPile, type Print } from '@/components/contact/PrintPile'
import { TypeText, typeEnd } from '@/components/motion/TypeText'
import { DEMO_CONTACT as DEMO, HOURS, instagramHandle } from '@/lib/copy'
import { enquiryMailto } from '@/lib/enquiry'
import { isPlaceholder } from '@/lib/placeholders'
import { singletonId, sitePath, SITES, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { SITE_SETTINGS_QUERY, TALENTS_BY_DIVISION_QUERY } from '@/sanity/lib/queries'
import type { SanityImage, SiteSettings, TalentCard } from '@/sanity/lib/types'

export async function generateMetadata({ params }: PageProps<'/[site]/contact'>): Promise<Metadata> {
  const site = (await params).site as Site
  return { title: 'Contact', description: `Book ${SITES[site].brand} talent or apply to join the board. Send us the brief: dates, location and usage, and we come back with a shortlist.`, alternates: { canonical: sitePath(site, '/contact') } }
}

type Row = { label: string; text: string; href?: string; external?: boolean }

/** A column of details, typing in one after another from `at`. */
function Details({ rows, at, align = 'left' }: { rows: Row[]; at: number; align?: 'left' | 'right' }) {
  // Each row starts once the one before has finished.
  const starts = rows.reduce<number[]>((acc, r, i) => [...acc, i ? typeEnd(rows[i - 1].text, typeEnd(rows[i - 1].label, acc[i - 1]) + 60, 12) + 120 : at], [])
  const items = rows.map((r, i) => {
    const labelAt = starts[i]
    const textAt = typeEnd(r.label, labelAt) + 60
    const text = <TypeText text={r.text} at={textAt} ms={12} />
    return (
      <div key={r.label} className="flex flex-col gap-1">
        {/* As the model stats: the label in regular capitals, the value bold. */}
        <dt className="uppercase" style={{ fontStretch: '80%' }}>
          <TypeText text={r.label} at={labelAt} />
        </dt>
        <dd className="whitespace-pre-line font-bold leading-snug">
          {r.href ? (
            <a href={r.href} target={r.external ? '_blank' : undefined} rel={r.external ? 'noreferrer' : undefined} className="ink-line inline-block">
              {text}
            </a>
          ) : (
            text
          )}
        </dd>
      </div>
    )
  })
  return <dl className={`flex flex-col text-detail gap-[clamp(18px,3vh,32px)] ${align === 'right' ? 'md:items-end md:text-right' : ''}`}>{items}</dl>
}

/**
 * Contact, in one screen: a pile of prints in the middle of the page, that you can move about, and
 * the details either side, typing themselves in. Phones: the details first (what the page is for),
 * then the pile, smaller, under them.
 */
export default async function ContactPage({ params }: PageProps<'/[site]/contact'>) {
  const site = (await params).site as Site
  const { division, brand } = SITES[site]
  const [s, talents] = await Promise.all([
    sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, { id: singletonId('siteSettings', site) }, null, ['siteSettings']),
    sanityFetch<TalentCard[]>(TALENTS_BY_DIVISION_QUERY, { division }, [], ['talent']),
  ])
  const email = s?.email || DEMO.email
  const phone = s?.phone || DEMO.phone
  const address = s?.address || DEMO.address
  const instagram = s?.instagram || DEMO.instagram

  // The prints: the real models' pictures (cover and book, a model at a time), else the placeholder looks.
  const real = talents.filter((t) => !isPlaceholder(t))
  const own = real.map((t) => [t.cover, ...(t.pics ?? [])].filter((i): i is SanityImage => !!i?.asset).filter((i, k, all) => all.findIndex((j) => j.asset!._ref === i.asset!._ref) === k))
  const interleaved = Array.from({ length: Math.max(0, ...own.map((l) => l.length)) }, (_, i) => own.flatMap((l, m) => (l[i] ? [{ img: l[i], name: real[m].name }] : []))).flat()
  // Eight prints: the real pictures, round again if there are fewer (a different crop each time round).
  const PRINTS = 8
  const prints: Print[] = interleaved.length
    ? Array.from({ length: Math.max(interleaved.length, PRINTS) }, (_, i) => {
        const { img, name } = interleaved[i % interleaved.length]
        const round = Math.floor(i / interleaved.length)
        const shot = urlFor(img).width(900)
        return { src: (round ? shot.height(1100).focalPoint(0.5, round % 2 ? 0.25 : 0.7).fit('crop') : shot).url(), alt: img.alt || name }
      })
    : [1, 3, 5, 7, 2, 9, 4, 6].map((n) => ({ src: `/placeholders/look-${String(n).padStart(2, '0')}.svg`, alt: '' }))

  const left: Row[] = [
    // Bookings: an email with the brief laid out, so the client only fills it in.
    { label: 'Bookings', text: email, href: enquiryMailto(email, { brand }) },
    { label: 'New faces', text: 'Apply online →', href: sitePath(site, '/apply') },
    { label: 'Phone', text: phone, href: `tel:${phone.replace(/\s/g, '')}` },
  ]
  const right: Row[] = [
    { label: 'Studio', text: address },
    { label: 'Instagram', text: instagramHandle(instagram), href: instagram, external: true },
    { label: 'Hours', text: HOURS },
  ]

  const BRIEF = 'Send us the brief: dates, location and usage. We come back with a shortlist from the board.'
  const bookings = enquiryMailto(email, { brand })
  return (
    // The first screen under the header; scrolling on reaches the footer.
    <div>
      <h1 className="sr-only">Contact {brand}</h1>
      {/* Computers: the details either side of the pile. */}
      <div className="hidden min-h-[calc(100svh-7rem)] grid-cols-[1fr_auto_1fr] items-center gap-x-[clamp(32px,4vw,80px)] px-gutter pb-[clamp(24px,4vh,48px)] md:grid">
        <Details rows={left} at={300} />
        {/* Prints from the board, landing on a pile; pick any of them up and move it about. */}
        <PrintPile prints={prints} className="aspect-[600/720] w-[min(36vw,62vh)]" />
        <Details rows={right} at={1000} align="right" />
      </div>
      {/* Phones: what the page is for first. The bookings address large, as in the footer, with the
          brief under it; the other details two by two; then the pile, smaller. */}
      <div className="flex flex-col gap-10 px-gutter pb-16 pt-6 md:hidden">
        <div className="flex flex-col gap-3">
          <p className="uppercase text-muted" style={{ fontStretch: '80%' }}>
            <TypeText text="Bookings" at={200} />
          </p>
          <a href={bookings} className="ink-line wordmark w-fit text-[clamp(28px,8.6vw,44px)] leading-none">
            <TypeText text={email} at={300} ms={24} />
          </a>
          <p className="max-w-[440px] text-[15px] leading-snug text-muted">
            <TypeText text={BRIEF} at={typeEnd(email, 300, 24)} ms={10} />
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 [&>dl]:contents">
          <Details rows={[...left.slice(1), ...right]} at={typeEnd(BRIEF, typeEnd(email, 300, 24), 10) + 100} />
        </div>
        <PrintPile prints={prints} className="mx-auto aspect-[600/720] w-[min(62vw,280px)]" />
      </div>
    </div>
  )
}
