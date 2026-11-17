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
/**
 * A model's Instagram as typed in the Studio — "@name", "name" or the whole link
 * ("https://www.instagram.com/name/?hl=en") — as her profile's address; nothing usable → undefined.
 */
export const instagramUrl = (v?: string | null) => {
  const handle = (v ?? '')
    .trim()
    .replace(/^(https?:\/\/)?(www\.|m\.)?instagram\.com\//i, '')
    .replace(/^@+/, '')
    .replace(/[/?#\s].*$/, '')
  return /^[\w.]+$/.test(handle) ? `https://www.instagram.com/${handle}/` : undefined
}
export const instagramHandle = (url: string) => url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')

// TODO: final DOT. line from INCH” — placeholder.
export const DEFAULT_DOT_STATEMENT = 'The men’s board of INCH” — few faces, each one exact'

