export const DIVISIONS = [
  { title: 'INCH” — Women', value: 'women' },
  { title: 'DOT. — Men', value: 'men' },
]

/**
 * A document's division is the Studio it is made in (INCH” at /studio/inch, DOT. at /studio/dot):
 * set for it, never chosen. (Each Studio's own "new" template sets it too; this covers the rest.)
 */
export const divisionField = () => ({
  name: 'division',
  type: 'string',
  options: { list: DIVISIONS },
  hidden: true,
  readOnly: true,
  initialValue: () => (typeof location !== 'undefined' && location.pathname.startsWith('/studio/dot') ? 'men' : 'women'),
})

/** `homePage-dot` / `drafts.homePage-dot` → 'men'; everything else → 'women'. */
export const divisionOfSingleton = (id: string) => (id.replace(/^drafts\./, '').endsWith('-dot') ? 'men' : 'women')
