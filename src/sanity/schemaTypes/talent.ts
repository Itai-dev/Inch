import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { defineArrayMember, defineField, defineType, type Rule } from 'sanity'
import { NumberedPreview } from '../components/NumberedPreview'
import { divisionField } from './division'
import { creditedImage } from './objects/creditedImage'

const gallery = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    group: 'media',
    options: { layout: 'grid' },
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
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'main',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    // Set by the Studio the model is made in (INCH” or DOT.), not chosen.
    defineField({ ...divisionField(), group: 'main', validation: (r: Rule) => r.required() }),
    // The model's place on the board: dragged in the Models list.
    orderRankField({ type: 'talent', newItemPosition: 'after' }),
    defineField({
      name: 'categories',
      type: 'array',
      group: 'main',
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
    select: { title: 'name', media: 'cover', id: '_id', division: 'division' },
    prepare: ({ title, media, id, division }) => ({ title, media, description: `${id}|${division}` }),
  },
  components: { preview: NumberedPreview },
})
