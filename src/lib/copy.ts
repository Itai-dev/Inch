/** Fallback copy until it's entered in the Studio. */
export const DEFAULT_STATEMENT =
  'Inch is a boutique modeling agency representing distinctive talent, curated with a precise eye for fashion and image. The perfect fit for your brand.'

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
    text: 'An inch is the smallest measure that still changes a fit. INCH” is built around that idea: a small board, chosen closely, and the time to get every detail right.',
  },
  {
    heading: 'The standard',
    text: 'INCH” represents a select board of women and men for the houses, magazines and brands that set the pace in fashion. Every career is managed by hand, from the first test to the campaign, with the discretion and attention that work at this level asks for.',
  },
]

// TODO: final DOT. line from INCH” — placeholder.
export const DEFAULT_DOT_STATEMENT = 'The men’s board of INCH” — sharp, considered, exact'
