import { defineArrayMember, defineField, defineType } from 'sanity'
import { DIVISIONS } from './division'

/** Submitted through the Smart Apply funnel. */
export const application = defineType({
  name: 'application',
  title: 'Application',
  type: 'document',
  fields: [
    defineField({
      name: 'status',
      type: 'string',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'Shortlisted', value: 'shortlisted' },
          { title: 'Invited', value: 'invited' },
          { title: 'Declined', value: 'declined' },
        ],
        layout: 'radio',
      },
      initialValue: 'new',
    }),
    defineField({ name: 'division', type: 'string', options: { list: DIVISIONS } }),
    defineField({ name: 'name', type: 'string' }),
    defineField({ name: 'age', type: 'number' }),
    defineField({ name: 'city', type: 'string' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({
      name: 'guardian',
      type: 'object',
      fields: [
        defineField({ name: 'name', type: 'string' }),
        defineField({ name: 'phone', type: 'string' }),
      ],
    }),
    defineField({ name: 'measurements', type: 'measurements' }),
    defineField({
      name: 'digitals',
      type: 'array',
      options: { layout: 'grid' },
      of: [defineArrayMember({ type: 'image' })],
    }),
    defineField({ name: 'instagram', type: 'string' }),
    defineField({ name: 'experience', type: 'text', rows: 3 }),
    defineField({ name: 'consent', type: 'boolean', readOnly: true }),
  ],
  orderings: [{ title: 'Newest', name: 'newest', by: [{ field: '_createdAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'status', media: 'digitals.0' },
  },
})
