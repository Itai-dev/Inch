import type { Division } from '@/sanity/lib/types'

/**
 * Smart Apply pre-screening rules.
 * PLACEHOLDER VALUES — to be agreed with INCH” before launch.
 */
export const APPLY_CRITERIA: Record<Division, { minAge: number; maxAge: number; minHeight: number; maxHeight: number }> = {
  women: { minAge: 14, maxAge: 35, minHeight: 172, maxHeight: 190 },
  men: { minAge: 15, maxAge: 40, minHeight: 182, maxHeight: 198 },
}

/** Below the board's minimum height an application isn't taken at all (the funnel says so, the API refuses it). */
export const tooShort = (division: Division, height: number) => height < APPLY_CRITERIA[division].minHeight

/** What a too-short applicant is told. */
export const tooShortMessage = (division: Division) =>
  `Unfortunately, your application isn’t relevant: we’re looking for models ${APPLY_CRITERIA[division].minHeight} cm and taller.`

/** Applicants younger than this need a parent or guardian's consent. */
export const ADULT_AGE = 18

/** Applicants younger than this can't apply at all. */
export const MIN_APPLY_AGE = 14

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
