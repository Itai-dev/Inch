import { defineArrayMember, defineField, defineType } from 'sanity'
import { DIVISIONS } from './division'

const gallery = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    options: { layout: 'grid' },
    of: [
      defineArrayMember({
        type: 'image',
        options: { hotspot: true },
        fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
      }),
    ],
  })

export const talent = defineType({
  name: 'talent',
  title: 'Talent',
  type: 'document',
  groups: [
    { name: 'main', title: 'Main', default: true },
    { name: 'media', title: 'Portfolio & Polaroids' },
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
    defineField({
      name: 'division',
      type: 'string',
      group: 'main',
      options: { list: DIVISIONS, layout: 'radio' },
      validation: (r) => r.required(),
    }),
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
    defineField({ name: 'order', title: 'Sort order', type: 'number', group: 'main' }),
    gallery('portfolio', 'Portfolio'),
    gallery('polaroids', 'Polaroids'),
    defineField({ name: 'measurements', type: 'measurements', group: 'details' }),
    defineField({ name: 'bio', type: 'text', rows: 4, group: 'details' }),
    defineField({ name: 'instagram', title: 'Instagram handle', type: 'string', group: 'details' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'division', media: 'cover' },
  },
})
