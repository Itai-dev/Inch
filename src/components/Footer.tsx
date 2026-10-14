import Link from 'next/link'
import { DEMO_CONTACT, HOURS, instagramHandle } from '@/lib/copy'
import { singletonId, sitePath, SITES, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { CATEGORIES_BY_DIVISION_QUERY, SITE_SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { Category, SiteSettings } from '@/sanity/lib/types'
import { Logo } from './brand/Logo'
import { SelectionCount } from './selection/SelectionCount'

/**
 * The footer, black on both sites: the bookings line large, then the board, the agency, the
 * studio and the small print in columns, and the wordmark across the whole width.
 */
export async function Footer({ site }: { site: Site }) {
  const s = SITES[site]
  const other: Site = site === 'dot' ? 'inch' : 'dot'
  const [settings, categories] = await Promise.all([
    sanityFetch<SiteSettings | null>(SITE_SETTINGS_QUERY, { id: singletonId('siteSettings', site) }, null, ['siteSettings']),
    sanityFetch<Category[]>(CATEGORIES_BY_DIVISION_QUERY, { division: s.division }, [], ['category']),
  ])
  const email = settings?.email || DEMO_CONTACT.email
  const phone = settings?.phone || DEMO_CONTACT.phone
  const address = settings?.address || DEMO_CONTACT.address
  const instagram = settings?.instagram || DEMO_CONTACT.instagram

  const columns: { title: string; links: React.ReactNode[] }[] = [
    {
      title: 'The board',
      links: [
        <Link key="all" href={sitePath(site, '/models')}>All models</Link>,
        ...categories.map((c) => <Link key={c._id} href={sitePath(site, `/models/${c.slug}`)}>{c.title}</Link>),
        <SelectionCount key="sel" />,
      ],
    },
    {
      title: 'Agency',
      links: [
        <Link key="home" href={sitePath(site)}>{s.brand} {s.label}</Link>,
        <Link key="other" href={sitePath(other)}>{SITES[other].brand} {SITES[other].label}</Link>,
        <Link key="apply" href={sitePath(site, '/apply')}>Become a model</Link>,
        <Link key="contact" href={sitePath(site, '/contact')}>Contact</Link>,
      ],
    },
    {
      title: 'Studio',
      links: [
        <span key="a" className="whitespace-pre-line">{address}</span>,
        <a key="p" href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>,
        <span key="h">{HOURS}</span>,
      ],
    },
    {
      title: 'Follow',
      links: [
        <a key="ig" href={instagram} target="_blank" rel="noreferrer">Instagram {instagramHandle(instagram)}</a>,
        <Link key="privacy" href={sitePath(site, '/privacy')}>Privacy</Link>,
        <Link key="a11y" href={sitePath(site, '/accessibility')}>Accessibility</Link>,
      ],
    },
  ]

  return (
    <footer className="mt-24 border-t border-white/15 bg-ink px-gutter pb-8 pt-[clamp(64px,8vw,140px)] text-paper [--fg:var(--paper)]">
      <div className="grid gap-y-14 md:grid-cols-12 md:gap-x-6">
        <div className="flex flex-col gap-4 md:col-span-5">
          <p className="label text-[#8a8a8a]">Bookings & new faces</p>
          <a href={`mailto:${email}`} className="wordmark w-fit text-[clamp(30px,3.6vw,64px)] leading-none hover:opacity-60">
            {email}
          </a>
          <Link href={sitePath(site, '/apply')} className="mt-4 flex h-12 w-fit items-center bg-paper px-7 text-[14px] font-bold uppercase tracking-[0.04em] text-ink hover:opacity-85" style={{ fontStretch: '80%' }}>
            Get scouted →
          </Link>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 md:col-span-7">
          {columns.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <p className="label text-[#8a8a8a]">{c.title}</p>
              <ul className="flex flex-col gap-2 text-[16px] leading-snug md:text-[18px]">
                {c.links.map((l, i) => (
                  <li key={i} className="[&>a]:underline-offset-4 hover:[&>a]:underline [&>button]:text-left [&>button]:normal-case hover:[&>button]:underline">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* The wordmark, the whole width. */}
      <Logo division={s.division} as="div" className="mt-[clamp(72px,9vw,160px)] w-full [&_svg]:!h-auto [&_svg]:!w-full" />

      <div className="label mt-6 flex flex-wrap items-center justify-between gap-4 text-[#8a8a8a]">
        <span>© {new Date().getFullYear()} {s.brand} Model Management</span>
        <a href="#" className="hover:text-paper">Back to top ↑</a>
      </div>
    </footer>
  )
}
