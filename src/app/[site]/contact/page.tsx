import type { Metadata } from 'next'
import Image from 'next/image'
import { DEMO_CONTACT as DEMO, HOURS, instagramHandle } from '@/lib/copy'
import { isPlaceholder } from '@/lib/placeholders'
import { singletonId, sitePath, SITES, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { SITE_SETTINGS_QUERY, TALENTS_BY_DIVISION_QUERY } from '@/sanity/lib/queries'
import type { SiteSettings, TalentCard } from '@/sanity/lib/types'

export async function generateMetadata({ params }: PageProps<'/[site]/contact'>): Promise<Metadata> {
  const site = (await params).site as Site
  return { title: 'Contact', alternates: { canonical: sitePath(site, '/contact') } }
}

/** Contact, in one screen: the details on one side, a picture from the board filling the other. */
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
  const cover = talents.find((t) => !isPlaceholder(t) && t.cover?.asset)?.cover

  const rows: [string, React.ReactNode][] = [
    ['Bookings', <a key="b" href={`mailto:${email}`}>{email}</a>],
    ['New faces', <a key="n" href={`mailto:${email}?subject=New%20faces`}>{email}</a>],
    ['Phone', <a key="p" href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>],
    ['Studio', <span key="a" className="whitespace-pre-line">{address}</span>],
    ['Instagram', <a key="i" href={instagram} target="_blank" rel="noreferrer">{instagramHandle(instagram)}</a>],
    ['Hours', HOURS],
  ]

  return (
    // One screen on larger screens: no scrolling, no footer (globals.css).
    <div data-fit-screen className="grid md:fixed md:inset-0 md:grid-cols-2">
      <div className="flex flex-col justify-center gap-[clamp(28px,4vh,56px)] px-gutter pb-12 pt-6 md:px-[var(--gutter)] md:pb-[clamp(24px,5vh,64px)] md:pt-[clamp(96px,14vh,160px)]">
        <h1 className="wordmark text-[clamp(64px,9vw,160px)] uppercase leading-[0.8]">Contact</h1>
        <dl className="grid max-w-[640px] grid-cols-1 gap-x-10 gap-y-[clamp(14px,2.4vh,26px)] text-[clamp(16px,1.3vw,20px)] sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="label text-muted">{k}</dt>
              <dd className="leading-snug [&_a]:underline-offset-4 hover:[&_a]:underline">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="label text-muted">{brand} — {division === 'men' ? 'Men' : 'Women'}</p>
      </div>
      <div className="relative h-[60dvh] overflow-hidden bg-line md:h-full">
        {cover ? (
          <Image src={urlFor(cover).width(1600).url()} alt="" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-[50%_20%] grayscale" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/placeholders/look-02.svg" alt="" className="absolute inset-0 size-full object-cover" />
        )}
      </div>
    </div>
  )
}
