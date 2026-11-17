import { defineArrayMember, defineField, defineType } from 'sanity'
import { DIVISIONS, otherSiteOnly } from './division'

/** Submitted through the Smart Apply funnel. */
export const application = defineType({
  name: 'application',
  title: 'Application',
  type: 'document',
  // Locked when opened in the other site's Studio.
  readOnly: otherSiteOnly,
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
    // The site it was sent from: not changed by hand (it would move the application to the other Studio).
    defineField({ name: 'division', type: 'string', options: { list: DIVISIONS }, readOnly: true }),
    defineField({ name: 'name', type: 'string' }),
    defineField({ name: 'birthdate', title: 'Date of birth', type: 'date' }),
    defineField({ name: 'age', title: 'Age when applying', type: 'number' }),
    // Asked by earlier versions of the form: shown only on the applications that have them.
    defineField({ name: 'country', type: 'string', hidden: ({ value }) => !value }),
    defineField({ name: 'city', type: 'string', hidden: ({ value }) => !value }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({
      name: 'guardian',
      type: 'object',
      fields: [
        defineField({ name: 'name', type: 'string' }),
        defineField({ name: 'phone', type: 'string' }),
        defineField({ name: 'consent', title: 'Consented to the application', type: 'boolean', readOnly: true }),
      ],
    }),
    defineField({ name: 'measurements', type: 'measurements' }),
    defineField({
      name: 'sizes',
      type: 'object',
      options: { columns: 2 },
      fields: [
        defineField({ name: 'tshirt', title: 'T-shirt', type: 'string' }),
        defineField({ name: 'pants', title: 'Pants (EU)', type: 'number' }),
      ],
    }),
    defineField({
      name: 'digitals',
      type: 'array',
      options: { layout: 'grid' },
      of: [defineArrayMember({ type: 'image' })],
    }),
    defineField({ name: 'instagram', type: 'string' }),
    defineField({ name: 'tiktok', title: 'TikTok', type: 'string', hidden: ({ value }) => !value }),
    defineField({ name: 'experience', type: 'text', rows: 3 }),
    defineField({
      name: 'outsideCriteria',
      title: 'Outside current criteria',
      description: 'Age or height outside the ranges in src/lib/apply-criteria.ts when they applied.',
      type: 'boolean',
      readOnly: true,
    }),
    defineField({ name: 'consent', type: 'boolean', readOnly: true }),
  ],
  orderings: [{ title: 'Newest', name: 'newest', by: [{ field: '_createdAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'status', media: 'digitals.0' },
  },
})
