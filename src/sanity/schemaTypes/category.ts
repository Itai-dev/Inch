import { defineField, defineType } from 'sanity'
import { DIVISIONS } from './division'

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
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
