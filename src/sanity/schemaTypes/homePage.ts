import { defineArrayMember, defineField, defineType } from 'sanity'
import { divisionOfSingleton } from './division'

/** One per site: documents `homePage-inch` and `homePage-dot`. */
export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  fields: [
    defineField({
      name: 'statement',
      title: 'Statement (home scroll reveal)',
      description: 'On DOT. the final ■ becomes the full stop.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'featured',
      title: 'Featured models',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'talent' }],
          options: { filter: ({ document }) => ({ filter: 'division == $division', params: { division: divisionOfSingleton(document._id) } }) },
        }),
      ],
    }),
  ],
})
