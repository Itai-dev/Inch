import { defineArrayMember, defineField, defineType } from 'sanity'
import { divisionOfSingleton } from './division'

/** One per site: documents `homePage-inch` and `homePage-dot`. Sections in page order. */
export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroVideos',
      title: 'Hero videos & images',
      description:
        'Full-screen behind the logo at the top of this site’s home page (INCH” and DOT. each have their own). Every 6 seconds the next one pushes in; the ruler at the bottom switches between them. Videos: MP4/WebM; their sound plays (visitors can turn it off).',
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
      title: 'Statement',
      description: 'The large paragraph that writes itself under the videos. Line breaks typed here are kept (from tablets up). On DOT. the final ■ becomes the full stop.',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'magazine',
      title: 'Magazine',
      description: 'The magazine under the statement: a cover, a first page of text, then a picture on every right page with a name on the page facing it. Pictures are printed in black and white.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'heading',
          title: 'Title',
          description: 'On the cover (bottom right) and large on the first page.',
          type: 'string',
          placeholder: 'The measure',
          validation: (r) => r.max(40),
        }),
        defineField({ name: 'text', title: 'Text', description: 'The paragraph on the first page. Keep it short: about 40 words fit.', type: 'text', rows: 4 }),
        defineField({ name: 'cover', title: 'Cover picture', description: 'Portrait. Empty = the first page’s picture.', type: 'image', options: { hotspot: true } }),
        defineField({
          name: 'pages',
          title: 'Pages',
          description: 'One per spread, in order: choose a model (her cover picture and name) or add any picture with its own caption. At least two; empty = the first five models on the board.',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'reference',
              title: 'Model',
              to: [{ type: 'talent' }],
              options: { filter: ({ document }) => ({ filter: 'division == $division', params: { division: divisionOfSingleton(document._id) } }) },
            }),
            defineArrayMember({
              type: 'object',
              name: 'picture',
              title: 'Picture',
              fields: [
                defineField({ name: 'image', title: 'Picture', type: 'image', options: { hotspot: true }, validation: (r) => r.required() }),
                defineField({ name: 'name', title: 'Caption', description: 'On the facing page: a name or a few words.', type: 'string', validation: (r) => r.max(40) }),
              ],
              preview: { select: { title: 'name', media: 'image' }, prepare: ({ title, media }) => ({ title: title || 'Picture', media }) },
            }),
          ],
        }),
      ],
    }),
  ],
})
