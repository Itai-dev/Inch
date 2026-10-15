import type { Metadata } from 'next'
import { Caveat } from 'next/font/google'
import Image from 'next/image'
import { TypeText, typeEnd } from '@/components/motion/TypeText'
import { DEMO_CONTACT as DEMO, HOURS, instagramHandle } from '@/lib/copy'
import { isPlaceholder } from '@/lib/placeholders'
import { singletonId, sitePath, SITES, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { SITE_SETTINGS_QUERY, TALENTS_BY_DIVISION_QUERY } from '@/sanity/lib/queries'
import type { SiteSettings, TalentCard } from '@/sanity/lib/types'

/** The pen on the contact sheet's notes. */
const hand = Caveat({ subsets: ['latin'], weight: '400' })

export async function generateMetadata({ params }: PageProps<'/[site]/contact'>): Promise<Metadata> {
  const site = (await params).site as Site
  return { title: 'Contact', alternates: { canonical: sitePath(site, '/contact') } }
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
            <a href={r.href} target={r.external ? '_blank' : undefined} rel={r.external ? 'noreferrer' : undefined} className="underline-offset-4 hover:underline">
              {text}
            </a>
          ) : (
            text
          )}
        </dd>
      </div>
    )
  })
  return <dl className={`flex flex-col gap-[clamp(18px,3vh,32px)] text-[clamp(16px,1.25vw,20px)] ${align === 'right' ? 'md:items-end md:text-right' : ''}`}>{items}</dl>
}

/** When a piece of the sheet comes in (ms), and for a print, the angle it lands from. */
const at = (ms: number, turn?: string) => ({ '--at': `${ms}ms`, ...(turn ? { '--turn': turn } : {}) }) as React.CSSProperties

/** A pencilled line, written left to right from `at`. */
function Hand({ at: ms, children }: { at: number; children: React.ReactNode }) {
  return (
    <span className="hand-line block" style={at(ms)}>
      {children}
    </span>
  )
}

/**
 * Contact, in one screen: a contact sheet in the middle of the page (a print clipped over a
 * larger one, with pencilled notes) and the details either side, typing themselves in.
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

  // The sheet's pictures: a model's cover, and a picture from her book on the clipped print.
  const model = talents.find((t) => !isPlaceholder(t) && t.cover?.asset)
  const big = model?.cover ? urlFor(model.cover).width(1000).url() : '/placeholders/look-02.svg'
  const bookPic = model?.pics?.find((p) => p?.asset && p.asset._ref !== model.cover?.asset?._ref)
  const small = bookPic ? urlFor(bookPic).width(700).url() : model?.cover ? urlFor(model.cover).width(700).url() : '/placeholders/look-05.svg'
  const city = address.split('\n').pop()?.replace(/\s*\d+$/, '') || 'the studio'

  const left: Row[] = [
    { label: 'Bookings', text: email, href: `mailto:${email}` },
    { label: 'New faces', text: email, href: `mailto:${email}?subject=New%20faces` },
    { label: 'Phone', text: phone, href: `tel:${phone.replace(/\s/g, '')}` },
  ]
  const right: Row[] = [
    { label: 'Studio', text: address },
    { label: 'Instagram', text: instagramHandle(instagram), href: instagram, external: true },
    { label: 'Hours', text: HOURS },
  ]

  return (
    // The first screen under the header; scrolling on reaches the footer.
    <div>
      <h1 className="sr-only">Contact {brand}</h1>
      <div className="grid items-center gap-y-12 px-gutter pb-16 pt-4 md:min-h-[calc(100svh-7rem)] md:grid-cols-[1fr_auto_1fr] md:gap-x-[clamp(32px,4vw,80px)] md:pb-[clamp(24px,4vh,48px)] md:pt-0">
        <div className="order-2 md:order-1">
          <Details rows={left} at={300} />
        </div>

        {/* The contact sheet. */}
        <figure className={`relative order-1 mx-auto aspect-[600/720] w-[min(86vw,420px)] md:order-2 md:w-[min(34vw,58vh)] ${hand.className}`}>
          <figcaption className="absolute left-[3%] top-[-5%] z-20 -rotate-2 text-[clamp(18px,1.7vw,26px)] leading-[1.05] text-[#4a4a47]">
            <Hand at={1250}>{brand} Studio</Hand>
            <Hand at={1700}>Bookings 001/004</Hand>
          </figcaption>
          {/* The larger print behind. */}
          <div className="sheet-print absolute bottom-[6%] left-[22%] right-[2%] top-[13%] border border-[#e4e4df] bg-[#f6f6f2] p-[3.5%] shadow-[0_18px_40px_-24px_rgb(0_0_0/0.35)]" style={at(100, '2deg')}>
            <div className="relative h-full overflow-hidden bg-line">
              <Image src={big} alt={model ? model.name : ''} fill priority sizes="(min-width: 768px) 30vw, 80vw" unoptimized={big.endsWith('.svg')} className="object-cover object-[50%_20%] grayscale" />
            </div>
          </div>
          {/* The print clipped over it. */}
          <div className="sheet-print absolute left-[1%] top-[11%] z-10 w-[52%] bg-[#fbfbf9] p-[3%] pb-[12%] shadow-[0_14px_30px_-14px_rgb(0_0_0/0.4)]" style={at(520, '-4deg')}>
            <div className="relative aspect-[4/4.6] overflow-hidden bg-line">
              {/* Without a second picture, a close crop of the same one. */}
              <Image src={small} alt="" fill sizes="(min-width: 768px) 18vw, 45vw" unoptimized={small.endsWith('.svg')} className={`object-cover object-top grayscale ${bookPic ? '' : 'origin-[50%_12%] scale-[1.9]'}`} />
            </div>
          </div>
          {/* The clip holding the two prints together, where the small one lies over the large one; it lands with them. */}
          <span className="sheet-clip absolute left-[37%] top-[3%] z-20 block aspect-[386/640] h-[21%]" style={at(1350)}>
            <Image src="/contact/paperclip.png" alt="" fill sizes="80px" className="-rotate-[12deg] object-contain drop-shadow-[0_3px_3px_rgb(0_0_0/0.28)]" />
          </span>
          <p aria-hidden className="absolute bottom-[-1%] right-[3%] z-20 -rotate-1 text-right text-[clamp(17px,1.5vw,24px)] leading-[1.05] text-[#4a4a47]">
            <Hand at={2150}>Fig. 001 {model?.name ?? 'The board'}</Hand>
            <Hand at={2650}>in {city}</Hand>
          </p>
        </figure>

        <div className="order-3">
          <Details rows={right} at={1000} align="right" />
        </div>
      </div>

    </div>
  )
}
