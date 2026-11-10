/** Fallback copy until it's entered in the Studio (line breaks typed there are kept from tablets up). */
export const DEFAULT_STATEMENT =
  'Inch is a boutique model agency: a small board of distinctive women, chosen with a precise eye and managed by hand. The right face for your brand, to the inch.'

/** Contact details shown until the real ones are in the Studio (Contact & settings). Once any is entered there, none of these show. */
export const DEMO_CONTACT = {
  email: 'hello@inch-mgmt.com',
  phone: '+972 3 555 0142',
  address: 'Rothschild Blvd 22\nTel Aviv 6688218',
  instagram: 'https://instagram.com/inch.mgmt',
  hours: 'Sunday – Thursday, 10:00 – 18:00',
}
export const instagramHandle = (url: string) => url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

/** The magazine's title and first page until they're written in the Studio (Home page › Magazine). */
// TODO: the real text from INCH”.
export const DEFAULT_MAGAZINE = {
  heading: 'The measure',
  text: 'An inch is the smallest measure that still changes a fit. INCH” works to it: a small board, chosen closely, and an agent who knows every model, and your brief, in detail.',
}

// TODO: final DOT. line from INCH” — placeholder.
export const DEFAULT_DOT_STATEMENT = 'The men’s board of INCH” — few faces, each one exact'

