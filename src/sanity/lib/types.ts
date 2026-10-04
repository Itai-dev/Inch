export type Division = 'women' | 'men'

export type SanityImage = { _key?: string; asset?: { _ref: string }; alt?: string }

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
}

export type Talent = TalentCard & {
  portfolio?: SanityImage[]
  polaroids?: SanityImage[]
  measurements?: Measurements
  bio?: string
  instagram?: string
  categories?: { title: string; slug: string }[]
}

export type Category = { _id: string; title: string; slug: string; division: Division }
