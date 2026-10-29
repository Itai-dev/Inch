/** Fallback copy until it's entered in the Studio (line breaks typed there are kept from tablets up). */
export const DEFAULT_STATEMENT =
  'Inch is a boutique model agency: a small board of distinctive women, chosen with a precise eye and managed by hand. The right face for your brand, to the inch.'

/** Contact details shown until the real ones are in the Studio (Site settings). TODO: demo values. */
export const DEMO_CONTACT = {
  email: 'hello@inch-mgmt.com',
  phone: '+972 3 555 0142',
  address: 'Rothschild Blvd 22\nTel Aviv 6688218',
  instagram: 'https://instagram.com/inch.mgmt',
}
export const HOURS = 'Sunday – Thursday, 10:00 – 18:00'
export const instagramHandle = (url: string) => url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')

/** Placeholder story for the home page until it's written in the Studio (Home page › Story). */
// TODO: the real story from INCH”.
export const DEFAULT_STORY = [
  {
    heading: 'The measure',
    text: 'An inch is the smallest measure that still changes a fit. INCH” works to it: a small board, chosen closely, and an agent who knows every model, and your brief, in detail.',
  },
  {
    heading: 'The standard',
    text: 'For the houses, magazines and brands that set the pace. Fewer faces than a large agency, so every booking gets our full attention, from the first casting to the campaign, with the discretion work at this level asks for.',
  },
]

// TODO: final DOT. line from INCH” — placeholder.
export const DEFAULT_DOT_STATEMENT = 'The men’s board of INCH” — few faces, each one exact'

