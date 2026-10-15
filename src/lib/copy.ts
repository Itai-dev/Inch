/** Fallback copy until it's entered in the Studio. */
export const DEFAULT_STATEMENT =
  'Inch is a boutique modeling agency representing distinctive talent, curated with a precise eye for fashion and image. The perfect fit for your brand.'

/**
 * Example captions for the home page's Selected work, shown under book pictures until the board
 * has real covers and ads (whose own publication and photographer show instead). TODO: demo copy.
 */
export const DEMO_WORK = [
  { kind: 'Cover', title: 'Spring issue' },
  { kind: 'Campaign', title: 'SS27 womenswear' },
  { kind: 'Editorial', title: 'Twelve pages, Paris' },
  { kind: 'Lookbook', title: 'Resort 2027' },
  { kind: 'Beauty', title: 'Fragrance launch' },
]

/** Contact details shown until the real ones are in the Studio (Site settings). TODO: demo values. */
export const DEMO_CONTACT = {
  email: 'hello@inch-mgmt.com',
  phone: '+972 3 555 0142',
  address: 'Rothschild Blvd 22\nTel Aviv 6688218',
  instagram: 'https://instagram.com/inch.mgmt',
}
export const HOURS = 'Sunday – Thursday, 10:00 – 18:00'
export const instagramHandle = (url: string) => url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')

/** The first year on the story's ruler. TODO: the agency's real founding year. */
export const STORY_FROM = 2016

/** Placeholder story for the home page until it's written in the Studio (Home page › Story). */
// TODO: the real story from INCH”.
export const DEFAULT_STORY = [
  {
    heading: 'The measure',
    text: 'An inch is the smallest measure that still changes a fit. INCH” is built around that idea: a small board, chosen closely, and the time to get every detail right.',
  },
  {
    heading: 'The fit',
    text: 'So the board stays small, and every name on it is there for a reason. We match each face to the work by hand, the right model for the right client at the right moment, and stay with it until the picture is made.',
  },
]

// TODO: final DOT. line from INCH” — placeholder.
export const DEFAULT_DOT_STATEMENT = 'The men’s board of INCH” — sharp, considered, exact'
