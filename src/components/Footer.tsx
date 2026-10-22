import Link from 'next/link'
import { DEMO_CONTACT, HOURS, instagramHandle } from '@/lib/copy'
import { enquiryMailto } from '@/lib/enquiry'
import { singletonId, sitePath, SITES, type Site } from '@/lib/sites'
import { sanityFetch } from '@/sanity/lib/client'
import { CATEGORIES_BY_DIVISION_QUERY, SITE_SETTINGS_QUERY } from '@/sanity/lib/queries'
import type { Category, SiteSettings } from '@/sanity/lib/types'
import { Logo } from './brand/Logo'
import { FooterMark } from './FooterMark'
import { TypeOnView } from './motion/TypeOnView'
import { TypeText, typeEnd } from './motion/TypeText'
import { SelectionCount } from './selection/SelectionCount'

/**
 * The footer, black on both sites: the bookings line large, then the board, the agency, the
 * studio and the small print in columns, all typing in as the footer comes into view; then
 * the wordmark across the whole width, growing in from the left, cut in half by the page's end.
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

  // Each entry types itself in; `sel` is the selection button, cut in whole.
  type Item = { text: string; href?: string; external?: boolean; pre?: boolean } | 'sel'
  const columns: { title: string; items: Item[] }[] = [
    {
      title: 'The board',
      items: [{ text: 'All models', href: sitePath(site, '/models') }, ...categories.map((c) => ({ text: c.title, href: sitePath(site, `/models/${c.slug}`) })), 'sel'],
    },
    {
      title: 'Agency',
      items: [
        { text: `${s.brand} ${s.label}`, href: sitePath(site) },
        { text: `${SITES[other].brand} ${SITES[other].label}`, href: sitePath(other) },
        { text: 'Apply', href: sitePath(site, '/apply') },
        { text: 'Contact', href: sitePath(site, '/contact') },
      ],
    },
    {
      title: 'Studio',
      items: [{ text: address, pre: true }, { text: phone, href: `tel:${phone.replace(/\s/g, '')}`, external: true }, { text: HOURS }],
    },
    {
      title: 'Follow',
      items: [
        { text: `Instagram ${instagramHandle(instagram)}`, href: instagram, external: true },
        { text: 'Privacy', href: sitePath(site, '/privacy') },
        { text: 'Accessibility', href: sitePath(site, '/accessibility') },
      ],
    },
  ]
  // When each piece starts typing (ms after the footer comes into view).
  const emailAt = 160
  const enquiry = enquiryMailto(email, { brand: s.brand })
  const BRIEF = 'Send us the brief: dates, location and usage. We come back with a shortlist from the board.'
  const ctaAt = typeEnd(BRIEF, typeEnd(email, emailAt, 24), 10) + 100
  const colAt = (c: number) => 300 + c * 160
  const cut = (at: number) => ({ '--at': `${at}ms` }) as React.CSSProperties

  return (
    <footer className="relative mt-24 overflow-hidden bg-ink pt-[clamp(64px,8vw,140px)] text-paper [--fg:var(--paper)]">
      <TypeOnView className="px-gutter">
        <div className="grid gap-y-14 md:grid-cols-12 md:gap-x-6">
          <div className="flex flex-col gap-4 md:col-span-5">
            <p className="label text-[#8a8a8a]"><TypeText text="Bookings" /></p>
            <a href={enquiry} className="kern ink-line wordmark w-fit text-[clamp(30px,3.6vw,64px)] leading-none">
              <TypeText text={email} at={emailAt} ms={24} />
            </a>
            <p className="max-w-[440px] text-[15px] leading-snug text-[#8a8a8a]">
              <TypeText text={BRIEF} at={typeEnd(email, emailAt, 24)} ms={10} />
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={enquiry} className="kern type-char flex h-12 w-fit items-center bg-paper px-7 text-[14px] font-bold uppercase text-ink hover:opacity-85" style={{ fontStretch: '80%', ...cut(ctaAt) }}>
                Book talent →
              </a>
              <Link href={sitePath(site, '/apply')} className="kern type-char flex h-12 w-fit items-center border border-paper px-7 text-[14px] font-bold uppercase hover:bg-paper hover:text-ink" style={{ fontStretch: '80%', ...cut(ctaAt + 120) }}>
                Become a model →
              </Link>
            </div>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 md:col-span-7">
            {columns.map((c, ci) => (
              <div key={c.title} className="flex flex-col gap-3">
                <p className="label text-[#8a8a8a]"><TypeText text={c.title} at={colAt(ci)} /></p>
                <ul className="flex flex-col gap-2 text-[16px] leading-snug md:text-[18px]">
                  {c.items.map((it, i) => {
                    const at = colAt(ci) + 140 + i * 90
                    if (it === 'sel')
                      return (
                        <li key="sel" className="type-char [&>button]:text-left [&>button]:normal-case" style={cut(at)}>
                          <SelectionCount />
                        </li>
                      )
                    const t = <TypeText text={it.text} at={at} ms={12} />
                    return (
                      <li key={i} className={it.pre ? 'whitespace-pre-line' : undefined}>
                        {!it.href ? t : it.external ? (
                          <a href={it.href} target={it.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="kern ink-line inline-block">{t}</a>
                        ) : (
                          <Link href={it.href} className="kern ink-line inline-block">{t}</Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="label mt-[clamp(56px,7vw,120px)] flex flex-wrap items-center justify-between gap-4 text-[#8a8a8a]">
          <span><TypeText text={`© ${new Date().getFullYear()} ${s.brand} Model Management`} at={colAt(4)} ms={10} /></span>
          <a href="#" className="kern ink-line inline-block hover:text-paper"><TypeText text="Back to top ↑" at={colAt(4)} ms={10} /></a>
        </div>
      </TypeOnView>

      {/* The wordmark, the whole width, growing in from the left; the page ends halfway down it. */}
      <div className="mt-6 px-gutter">
        <FooterMark ratio={s.division === 'men' ? 52 / 24 : 849 / 310}>
          <Logo division={s.division} as="div" className="w-full" />
        </FooterMark>
      </div>
    </footer>
  )
}
