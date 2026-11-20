import type { SlugRule } from 'sanity'

/** The slug is the page's address, so: lowercase letters, numbers and dashes only (press Generate). */
export const slugRule = (r: SlugRule) =>
  r.required().custom((slug) =>
    !slug?.current || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug.current)
      ? true
      : 'Lowercase letters, numbers and dashes only, e.g. "sun-mizrahi" — press Generate to make it from the name.',
  )
