import { cache } from 'react'
import { DEMO_CONTACT } from '@/lib/copy'
import { singletonId, type Site } from '@/lib/sites'
import { sanityFetch } from './client'
import { SITE_SETTINGS_QUERY } from './queries'
import type { ApplyThanks, Contact, SanityImage } from './types'

const CONTACT_FIELDS = ['email', 'phone', 'address', 'instagram', 'hours'] as const
type ContactDoc = Partial<Record<(typeof CONTACT_FIELDS)[number], string | null>>
type SettingsDoc = ContactDoc & { title?: string; description?: string; ogImage?: SanityImage; contactImages?: SanityImage[] | null; thanks?: ApplyThanks | null }

/**
 * A site's settings from the Studio (Contact & settings). The contact details are read here and
 * nowhere else, so a change there shows everywhere: footer, contact page, menu, booking emails,
 * apply page, comp cards. DOT. uses INCH”'s for any detail of its own left empty. While nothing at
 * all is entered the demo details show (`demo`); once anything is, an empty detail is simply left out.
 */
export const getSettings = cache(async (site: Site) => {
  const { own, main } = await sanityFetch<{ own: SettingsDoc | null; main: ContactDoc | null }>(
    SITE_SETTINGS_QUERY,
    { id: singletonId('siteSettings', site), main: singletonId('siteSettings', 'inch') },
    { own: null, main: null },
    ['siteSettings'],
  )
  const pick = (k: (typeof CONTACT_FIELDS)[number]) => own?.[k]?.trim() || main?.[k]?.trim() || undefined
  const demo = !CONTACT_FIELDS.some(pick)
  const contact: Contact = demo
    ? DEMO_CONTACT
    : { email: pick('email') ?? DEMO_CONTACT.email, phone: pick('phone'), address: pick('address'), instagram: pick('instagram'), hours: pick('hours') }
  return {
    contact,
    demo,
    title: own?.title?.trim() || undefined,
    description: own?.description?.trim() || undefined,
    ogImage: own?.ogImage?.asset ? own.ogImage : undefined,
    contactImages: (own?.contactImages ?? []).filter((i) => i?.asset),
    thanks: own?.thanks ?? undefined,
  }
})
