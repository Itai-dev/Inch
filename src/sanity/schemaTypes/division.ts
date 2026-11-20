export const DIVISIONS = [
  { title: 'INCH” — Women', value: 'women' },
  { title: 'DOT. — Men', value: 'men' },
]

/**
 * A document's division is the Studio it is made in (INCH” at /studio/inch, DOT. at /studio/dot):
 * set for it, never chosen. (Each Studio's own "new" template sets it too; this covers the rest.)
 */
/** The Studio that is open: DOT. at /studio/dot, INCH” otherwise. */
export const studioDivision = () => (typeof location !== 'undefined' && location.pathname.startsWith('/studio/dot') ? 'men' : 'women')

/** `homePage-dot` / `drafts.homePage-dot` → 'men'; everything else → 'women'. */
export const divisionOfSingleton = (id: string) => (id.replace(/^drafts\./, '').endsWith('-dot') ? 'men' : 'women')

const SINGLETON = /^(drafts\.)?(homePage|contactPage|siteSettings)-(inch|dot)$/

/** The site a document belongs to: its division, or for the per-site pages (Home, Contact, Site settings) their id. */
export const divisionOfDocument = (doc?: { _id?: string; division?: unknown } | null) =>
  doc?.division === 'women' || doc?.division === 'men' ? doc.division : doc?._id && SINGLETON.test(doc._id) ? divisionOfSingleton(doc._id) : undefined

/**
 * True for the other site's documents. Each Studio lists only its own, but a search or an old link
 * can still open one: it is then locked (read-only, no Publish / Delete), so nothing made or
 * changed in INCH”'s Studio can land on DOT., or the other way round.
 */
export const isOtherSites = (doc?: { _id?: string; division?: unknown } | null) => {
  const d = divisionOfDocument(doc)
  return !!d && d !== studioDivision()
}

/** For a document type's `readOnly`. */
export const otherSiteOnly = ({ document }: { document?: { _id?: string; division?: unknown } }) => isOtherSites(document)

export const divisionField = () => ({
  name: 'division',
  type: 'string',
  options: { list: DIVISIONS },
  hidden: true,
  readOnly: true,
  initialValue: studioDivision,
})
