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
      name: 'heroVideos',
      title: 'Hero videos & images (INCH”)',
      description:
        'Full-screen behind the INCH” logo. Every 4 seconds the next one pushes in; the ruler at the bottom switches between them. Videos: MP4/WebM, muted.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'heroVideo',
          fields: [
            defineField({ name: 'video', type: 'file', options: { accept: 'video/mp4,video/webm' }, validation: (r) => r.required() }),
            defineField({ name: 'poster', title: 'Poster', description: 'Shown while this video loads.', type: 'image', options: { hotspot: true } }),
          ],
          preview: {
            select: { title: 'video.asset.originalFilename', media: 'poster' },
            prepare: ({ title, media }) => ({ title: title || 'Video', subtitle: 'Video', media }),
          },
        }),
        defineArrayMember({ type: 'image', name: 'heroImage', title: 'Image', options: { hotspot: true } }),
      ],
    }),
    // Older single-video fields: only shown while they still hold something.
    defineField({
      name: 'heroVideo',
      title: 'Hero video (old — move into Hero videos)',
      type: 'file',
      options: { accept: 'video/mp4,video/webm' },
      hidden: ({ document }) => !document?.heroVideo,
    }),
    defineField({
      name: 'heroPoster',
      title: 'Hero poster (old)',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ document }) => !document?.heroVideo,
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
