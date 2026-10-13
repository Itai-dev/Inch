import type { Division } from '@/sanity/lib/types'

/**
 * Smart Apply pre-screening rules.
 * PLACEHOLDER VALUES — to be agreed with INCH” before launch.
 */
export const APPLY_CRITERIA: Record<Division, { minAge: number; maxAge: number; minHeight: number; maxHeight: number }> = {
  women: { minAge: 14, maxAge: 35, minHeight: 170, maxHeight: 190 },
  men: { minAge: 15, maxAge: 40, minHeight: 180, maxHeight: 198 },
}

export const GUARDIAN_AGE = 18

export function meetsCriteria(division: Division, age: number, height: number) {
  const c = APPLY_CRITERIA[division]
  return age >= c.minAge && age <= c.maxAge && height >= c.minHeight && height <= c.maxHeight
}

/** Whole years from a YYYY-MM-DD birth date to today (NaN if it isn't a date). */
export function ageFrom(birthdate: string, today = new Date()) {
  const [y, m, d] = birthdate.split('-').map(Number)
  if (!y || !m || !d) return NaN
  const birthdayPassed = today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d)
  return today.getFullYear() - y - (birthdayPassed ? 0 : 1)
}
