import { defineArrayMember, defineField, defineType } from 'sanity'
import { DriveArrayInput } from '../drive/DriveArrayInput'

/**
 * One per site: documents `contactPage-inch` and `contactPage-dot`. The contact details here are
 * the ones on the Contact page and in the footer of every page.
 */
export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact page',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Bookings email',
      description: 'Contact page, footer and the “Book” buttons. Applications go to their own address (set by us).',
      type: 'string',
    }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({ name: 'address', title: 'Studio address', type: 'text', rows: 2 }),
    defineField({ name: 'hours', title: 'Opening hours', type: 'string', placeholder: 'Sunday – Thursday, 10:00 – 18:00' }),
    defineField({ name: 'instagram', title: 'Instagram link', type: 'url', placeholder: 'https://instagram.com/…' }),
    defineField({
      name: 'prints',
      title: 'Photos',
      description: 'The pile of prints in the middle of the Contact page, in this order (8 or more look best). Empty = pictures from the board.',
      type: 'array',
      options: { layout: 'grid' },
      components: { input: DriveArrayInput },
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Who / what (for screen readers)', type: 'string' })],
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Contact page' }) },
})
