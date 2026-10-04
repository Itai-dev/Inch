import type { Slide } from '@/components/motion/types'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, TalentCard } from '@/sanity/lib/types'

export const talentSlides = (talents: TalentCard[]): Slide[] =>
  talents
    .filter((t) => t.cover?.asset)
    .map((t) => ({
      id: t._id,
      src: urlFor(t.cover).width(1200).height(1600).url(),
      alt: t.name,
      caption: t.name,
      href: `/talent/${t.slug}`,
    }))

export const imageSlides = (images: SanityImage[] = [], name: string): Slide[] =>
  images
    .filter((i) => i.asset)
    .map((img, k) => ({
      id: img._key || String(k),
      src: urlFor(img).width(1400).url(),
      alt: img.alt || `${name} — ${k + 1}`,
      caption: img.alt || name,
    }))

export const placeholderSlides = (n = 10): Slide[] =>
  Array.from({ length: n }, (_, k) => {
    const id = String(k + 1).padStart(2, '0')
    return { id, src: `/placeholders/look-${id}.svg`, alt: `Look ${id}`, caption: `Look ${id}` }
  })
