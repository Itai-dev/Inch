export const DIVISIONS = [
  { title: 'INCH” — Women', value: 'women' },
  { title: 'DOT. — Men', value: 'men' },
]

/** `homePage-dot` / `drafts.homePage-dot` → 'men'; everything else → 'women'. */
export const divisionOfSingleton = (id: string) => (id.replace(/^drafts\./, '').endsWith('-dot') ? 'men' : 'women')
