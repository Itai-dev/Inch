export type Division = 'women' | 'men'

export type SanityImage = {
  _key?: string
  asset?: { _ref: string }
  alt?: string
  publication?: string
  photographer?: string
  stylist?: string
  hair?: string
  makeup?: string
}

export type Measurements = {
  height?: number
  bust?: number
  waist?: number
  hips?: number
  shoes?: number
  hair?: string
  eyes?: string
}

export type TalentCard = {
  _id: string
  name: string
  slug: string
  division: Division
  cover?: SanityImage
  /** Local cover image, for placeholder models that aren't in Sanity. */
  coverSrc?: string
  /** The first few book images, where a query asks for them (the home page's name strip). */
  pics?: SanityImage[] | null
}

export type Talent = TalentCard & {
  portfolio?: SanityImage[]
  coversAds?: SanityImage[]
  polaroids?: SanityImage[]
  measurements?: Measurements
  bio?: string
  instagram?: string
  categories?: { title: string; slug: string }[]
}

export type Category = { _id: string; title: string; slug: string; division: Division }

export type SiteSettings = { email?: string; phone?: string; address?: string; instagram?: string }
