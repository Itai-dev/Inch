import { defineArrayMember, defineField, defineType } from 'sanity'
import { DIVISIONS, otherSiteOnly } from './division'

/** Created from the website when a booker shares a talent selection. */
export const selection = defineType({
  name: 'selection',
  title: 'Shared selection',
  type: 'document',
  // Locked when opened in the other site's Studio.
  readOnly: otherSiteOnly,
  fields: [
    defineField({ name: 'shareId', type: 'string', readOnly: true }),
    // The site it was made on (set by the website).
    defineField({ name: 'division', type: 'string', options: { list: DIVISIONS }, readOnly: true, hidden: true }),
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'note', type: 'text', rows: 3 }),
    defineField({
      name: 'talents',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'talent' }],
          weak: true,
          // Only this selection's own site's models.
          options: { filter: ({ document }) => ({ filter: 'division == $division', params: { division: document.division ?? 'women' } }) },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'shareId' } },
})
