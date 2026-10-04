import { defineArrayMember, defineField, defineType } from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  fields: [
    defineField({ name: 'heroTitle', type: 'string' }),
    defineField({ name: 'heroSubtitle', type: 'text', rows: 2 }),
    defineField({
      name: 'featured',
      title: 'Featured talents',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'talent' }] })],
    }),
  ],
})
