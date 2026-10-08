import { defineArrayMember, defineField, defineType } from 'sanity'
import { divisionOfSingleton } from './division'
import { creditedImage } from './objects/creditedImage'

/** One per site: documents `homePage-inch` and `homePage-dot`. Sections in page order. */
export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroVideo',
      title: 'Hero video (INCH”)',
      description: 'Opens from the ” to full screen on scroll. MP4, muted, loops.',
      type: 'file',
      options: { accept: 'video/mp4,video/webm' },
    }),
    defineField({
      name: 'heroPoster',
      title: 'Hero poster',
      description: 'Shown while the video loads, or instead of it.',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'statement',
      title: 'Statement (home scroll reveal)',
      description: 'On DOT. the final ■ becomes the full stop.',
      type: 'text',
      rows: 3,
    }),
    defineField({ name: 'intro', title: 'Paragraph', description: 'Below the statement.', type: 'text', rows: 5 }),
    defineField({
      name: 'introImages',
      title: 'Paragraph images',
      type: 'array',
      options: { layout: 'grid' },
      of: [creditedImage()],
    }),
    defineField({
      name: 'featured',
      title: 'Featured models',
      description: 'Models section. Empty = all models.',
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
