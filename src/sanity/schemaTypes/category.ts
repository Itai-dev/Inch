import { defineArrayMember, defineField, defineType, type Rule } from 'sanity'
import { apiVersion } from '../env'
import { divisionField } from './division'
import { slugRule } from './slug'
import { CleanSlugInput } from '../components/CleanSlugInput'

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      // Tidied as it's typed: lowercase, dashes for spaces.
      components: { input: CleanSlugInput },
      // INCH” and DOT. can both have e.g. "new-faces".
      options: {
        source: 'title',
        isUnique: (slug, { document, getClient }) => {
          const id = document?._id.replace(/^drafts\./, '') ?? ''
          return getClient({ apiVersion }).fetch(
            'count(*[_type == "category" && slug.current == $slug && division == $division && !(_id in [$id, $draft])]) == 0',
            { slug, division: document?.division ?? null, id, draft: `drafts.${id}` },
          )
        },
      },
      validation: slugRule,
    }),
    // Set by the Studio the category is made in (INCH” or DOT.), not chosen.
    defineField({ ...divisionField(), validation: (r: Rule) => r.required() }),
    defineField({
      name: 'models',
      description: 'The models in this category, in this order (drag to reorder). Publish, and the category shows them on the site.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'talent' }],
          // Only this site's models.
          options: { filter: ({ document }) => ({ filter: 'division == $division', params: { division: document.division } }) },
        }),
      ],
      validation: (r) => r.unique(),
    }),
    defineField({ name: 'order', title: 'Order in the menu', description: 'Lower comes first.', type: 'number' }),
  ],
  preview: { select: { title: 'title', subtitle: 'division' } },
})
