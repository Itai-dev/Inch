import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { defineArrayMember, defineField, defineType, type Rule } from 'sanity'
import { NumberedPreview } from '../components/NumberedPreview'
import { DriveArrayInput } from '../drive/DriveArrayInput'
import { divisionField } from './division'
import { creditedImage } from './objects/creditedImage'
import { slugRule } from './slug'
import { CleanSlugInput } from '../components/CleanSlugInput'

const gallery = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    group: 'media',
    options: { layout: 'grid' },
    // "Add from Google Drive" under the grid (once the agency's Google keys are set).
    components: { input: DriveArrayInput },
    of: [
      // Credits show below each image.
      creditedImage(),
    ],
  })

export const talent = defineType({
  name: 'talent',
  title: 'Talent',
  type: 'document',
  groups: [
    { name: 'main', title: 'Main', default: true },
    { name: 'media', title: 'Books' },
    { name: 'details', title: 'Measurements & Bio' },
  ],
  fields: [
    defineField({ name: 'name', type: 'string', group: 'main', validation: (r) => r.required() }),
    // Off the site (board, categories, her page, selections, home) but kept in the Studio, to bring back any time.
    defineField({
      name: 'hidden',
      title: 'Hide from the site',
      description: 'On: she disappears from the website but stays here. Turn off to show her again. (To remove her for good: ⋯ next to Publish → Delete.)',
      type: 'boolean',
      group: 'main',
      initialValue: false,
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      // Tidied as it's typed: lowercase, dashes for spaces.
      components: { input: CleanSlugInput },
      group: 'main',
      options: { source: 'name' },
      validation: slugRule,
    }),
    // Set by the Studio the model is made in (INCH” or DOT.), not chosen.
    defineField({ ...divisionField(), group: 'main', validation: (r: Rule) => r.required() }),
    // The model's place on the board: dragged in the Models list.
    orderRankField({ type: 'talent', newItemPosition: 'after' }),
    defineField({
      name: 'categories',
      title: 'Categories (old — add models from the category)',
      type: 'array',
      group: 'main',
      // Models are put in a category from the category itself now; this shows only while it still holds some.
      hidden: ({ value }: { value?: unknown[] }) => !value?.length,
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'category' }],
          // Only this model's own site's categories.
          options: { filter: ({ document }) => ({ filter: 'division == $division', params: { division: document.division } }) },
        }),
      ],
    }),
    defineField({ name: 'cover', title: 'Cover image', type: 'image', group: 'main', options: { hotspot: true } }),
    // (Replaced by the dragged order; kept hidden for older documents.)
    defineField({ name: 'order', title: 'Sort order', type: 'number', group: 'main', hidden: true }),
    gallery('portfolio', 'Portfolio'),
    // (No longer a book of its own, on either site: kept hidden so older documents keep their pictures.)
    { ...gallery('coversAds', 'Covers + Ads'), hidden: true },
    gallery('polaroids', 'Polaroids'),
    defineField({ name: 'measurements', type: 'measurements', group: 'details' }),
    defineField({ name: 'bio', type: 'text', rows: 4, group: 'details' }),
    defineField({ name: 'instagram', title: 'Instagram handle', type: 'string', group: 'details' }),
  ],
  orderings: [orderRankOrdering],
  // Numbered by her place on the board (the id and division ride in the description for that).
  preview: {
    select: { title: 'name', media: 'cover', id: '_id', division: 'division', hidden: 'hidden' },
    prepare: ({ title, media, id, division, hidden }) => ({ title, media, description: `${id}|${division}|${hidden ? 1 : 0}` }),
  },
  components: { preview: NumberedPreview },
})
