import { defineField, defineType } from 'sanity'
import { apiVersion } from '../env'
import { DIVISIONS } from './division'

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
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
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'division',
      type: 'string',
      options: { list: DIVISIONS, layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'order', type: 'number' }),
  ],
  preview: { select: { title: 'title', subtitle: 'division' } },
})
