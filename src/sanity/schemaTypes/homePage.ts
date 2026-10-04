import { defineArrayMember, defineField, defineType } from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  fields: [
    defineField({
      name: 'statement',
      title: 'INCH” statement (home scroll reveal)',
      type: 'text',
      rows: 3,
      initialValue:
        'Inch is a boutique modeling agency representing distinctive talent, curated with a precise eye for fashion and image. The perfect fit for your brand.',
    }),
    defineField({
      name: 'dotStatement',
      title: 'DOT. statement (men page reveal — the final ■ is the full stop)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'featured',
      title: 'Featured talents',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'talent' }] })],
    }),
  ],
})
