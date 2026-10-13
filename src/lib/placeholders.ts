import type { Slide } from '@/components/motion/types'
import type { Division, Talent, TalentCard } from '@/sanity/lib/types'
import { placeholderSlides } from './slides'

/**
 * Stand-in models so the board and the model page can be seen before the real
 * roster is in the Studio. The board is topped up to PLACEHOLDER_FILL cards; set it
 * to 0 to switch placeholders off.
 */
export const PLACEHOLDER_FILL = 20

const NAMES: Record<Division, string[]> = {
  women: [
    'Ada Laine', 'Bea Moretti', 'Cleo Varga', 'Dana Holm', 'Elin Roux', 'Faye Okafor', 'Gaia Benet',
    'Hana Ilić', 'Iris Duval', 'Jade Kowal', 'Kira Sand', 'Lior Ben-Ami', 'Mila Rossi', 'Noa Peretz',
    'Odile Marsh', 'Pia Lund', 'Romy Hart', 'Sun Arad', 'Tali Weiss', 'Uma Ferreira',
  ],
  men: [
    'Adam Kerr', 'Ben Ito', 'Carl Mertens', 'Dov Alon', 'Eli Brandt', 'Finn Moore', 'Gal Navon',
    'Hugo Lenz', 'Ido Shaked', 'Jon Vidal', 'Kai Berg', 'Leo Sato', 'Max Ortega', 'Nir Hadar',
    'Omer Katz', 'Paul Weber', 'Rafa Costa', 'Sam Okoye', 'Tom Riva', 'Yoav Mor',
  ],
}

const PREFIX = 'placeholder-'
const look = (k: number) => `/placeholders/look-${String((k % 10) + 1).padStart(2, '0')}.svg`
const slugOf = (name: string) => PREFIX + name.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').replace(/ +/g, '-')

const card = (division: Division, name: string, k: number): TalentCard => ({
  _id: `${PREFIX}${division}-${k}`,
  name,
  slug: slugOf(name),
  division,
  coverSrc: look(k),
})

export const isPlaceholder = (t: { _id: string }) => t._id.startsWith(PREFIX)

/** Real talents first, then placeholders up to PLACEHOLDER_FILL. */
export const withPlaceholders = (talents: TalentCard[], division: Division): TalentCard[] =>
  talents.length >= PLACEHOLDER_FILL
    ? talents
    : [...talents, ...NAMES[division].slice(0, PLACEHOLDER_FILL - talents.length).map((n, k) => card(division, n, k))]

/** A full placeholder model for /talent/placeholder-… (null for any other slug). */
export function placeholderTalent(slug: string): Talent | null {
  if (!slug.startsWith(PREFIX) || !PLACEHOLDER_FILL) return null
  for (const division of ['women', 'men'] as Division[]) {
    const k = NAMES[division].findIndex((n) => slugOf(n) === slug)
    if (k < 0) continue
    const men = division === 'men'
    return {
      ...card(division, NAMES[division][k], k),
      measurements: men
        ? { height: 186 + (k % 5), bust: 96, waist: 78, hips: 94, shoes: 44, hair: 'Brown', eyes: 'Green' }
        : { height: 174 + (k % 6), bust: 80, waist: 60, hips: 88, shoes: 39, hair: 'Blond', eyes: 'Blue' },
      bio: 'Placeholder model. Add the real roster in the Studio and this card disappears.',
      instagram: '@inch.mgmt',
    }
  }
  return null
}

/** Placeholder books, rotated so each model's book starts on a different look. */
export const placeholderBook = (t: TalentCard, n: number): Slide[] => {
  const shift = Number(t._id.split('-').pop()) || 0
  const all = placeholderSlides(10)
  return Array.from({ length: n }, (_, j) => ({ ...all[(j + shift) % 10], id: String(j) }))
}
