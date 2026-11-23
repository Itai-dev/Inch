import { defineArrayMember, defineField, defineType } from 'sanity'
import { divisionOfSingleton, otherSiteOnly } from './division'
import { creditedImage } from './objects/creditedImage'
import { MagazinePagesInput } from '../drive/DriveArrayInput'

/** One per site: documents `homePage-inch` and `homePage-dot`. Sections in page order: the hero, the statement, the magazine. */
export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  // Locked when opened in the other site's Studio; reached from each Studio's own list, not the search.
  readOnly: otherSiteOnly,
  __experimental_omnisearch_visibility: false,
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
      title: 'Statement (home scroll reveal)',
      description:
        'One or two sentences read best: the shorter the text, the larger it is set. A new line after a full stop starts a new line on the site. On DOT. the final ■ becomes the full stop.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'magazine',
      title: 'Magazine',
      description: 'The magazine under the statement, page by page. It shows only what is added here; with no pages, the home page has no magazine.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'cover', title: 'Cover', description: 'The front of the magazine, under the logo.', type: 'image', options: { hotspot: true } }),
        defineField({ name: 'heading', title: 'Title', description: 'On the cover and on the first page inside.', type: 'string', validation: (r) => r.max(40) }),
        defineField({ name: 'text', title: 'First page text', description: 'The first page inside (on the left), under the title.', type: 'text', rows: 4 }),
        defineField({
          name: 'pages',
          title: 'Pages',
          description:
            'The pages after the first one, in order: right, left, right, left… Page = a photo, or a name on a white page. Spread = one photo across both pages of an opening (it always starts on a left page; a blank page is added before it when needed). Drag to reorder.',
          type: 'array',
          // "Upload photos": several pages at once, each a photo.
          components: { input: MagazinePagesInput },
          of: [
            defineArrayMember({
              type: 'object',
              name: 'page',
              title: 'Page',
              fields: [
                defineField({ name: 'image', title: 'Photo', type: 'image', options: { hotspot: true } }),
                defineField({ name: 'name', title: 'Name', description: 'With no photo: printed on a white page (as a model’s name facing her photo). With a photo: its caption, when Caption below is empty.', type: 'string' }),
                defineField({ name: 'caption', title: 'Caption', description: 'Printed small at the foot of the photo, e.g. "Romi Peled for Prada s/s24". Leave empty for none.', type: 'string', validation: (r) => r.max(80) }),
              ],
              validation: (r) => r.custom((v: { image?: { asset?: unknown }; name?: string } | undefined) => (v?.image?.asset || v?.name ? true : 'Add a photo or a name')),
              preview: {
                select: { name: 'name', media: 'image' },
                prepare: ({ name, media }) => ({ title: media ? 'Photo' : name || 'Empty page', subtitle: media ? 'Page' : 'Page · name', media }),
              },
            }),
            defineArrayMember({
              type: 'object',
              name: 'spread',
              title: 'Spread (both pages)',
              fields: [
                defineField({ name: 'image', title: 'Photo', type: 'image', options: { hotspot: true }, validation: (r) => r.required() }),
                defineField({ name: 'caption', title: 'Caption', description: 'Printed small at the foot of the photo, e.g. "Romi Peled for Prada s/s24". Leave empty for none.', type: 'string', validation: (r) => r.max(80) }),
              ],
              preview: { select: { media: 'image' }, prepare: ({ media }) => ({ title: 'Spread', subtitle: 'Both pages', media }) },
            }),
          ],
        }),
      ],
    }),
    // Older sections, not on the home page any more: shown only while they still hold something.
    defineField({ name: 'intro', title: 'Paragraph (old — not on the site)', type: 'text', rows: 5, hidden: ({ value }) => !value }),
    defineField({
      name: 'introImages',
      title: 'Paragraph images (old — not on the site)',
      type: 'array',
      options: { layout: 'grid' },
      of: [creditedImage()],
      hidden: ({ value }) => !value?.length,
    }),
    defineField({
      name: 'story',
      title: 'Story (old — use Magazine)',
      description: 'Used for the magazine only while Magazine above has no pages: the first chapter.',
      hidden: ({ value }) => !value?.length,
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'chapter',
          fields: [
            defineField({ name: 'heading', type: 'string', validation: (r) => r.required().max(40) }),
            defineField({ name: 'text', type: 'text', rows: 4, validation: (r) => r.required() }),
            defineField({ name: 'images', type: 'array', of: [creditedImage()], validation: (r) => r.max(3) }),
          ],
          preview: { select: { title: 'heading', subtitle: 'text', media: 'images.0' } },
        }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured models (old — not on the site)',
      description: 'The magazine’s fallback pages when it has none of its own. Empty = all models.',
      type: 'array',
      hidden: ({ value }) => !value?.length,
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'talent' }],
          options: { filter: ({ document }) => ({ filter: 'division == $division', params: { division: divisionOfSingleton(document._id) } }) },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
})
