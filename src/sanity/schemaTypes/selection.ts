import { defineArrayMember, defineField, defineType } from 'sanity'

/** Created from the website when a booker shares a talent selection. */
export const selection = defineType({
  name: 'selection',
  title: 'Shared selection',
  type: 'document',
  readOnly: false,
  fields: [
    defineField({ name: 'shareId', type: 'string', readOnly: true }),
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'note', type: 'text', rows: 3 }),
    defineField({
      name: 'talents',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'talent' }], weak: true })],
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'shareId' } },
})
