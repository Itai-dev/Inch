import { defineField, defineType } from 'sanity'

/** One per site: documents `siteSettings-inch` and `siteSettings-dot`. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'description', title: 'SEO description', type: 'text', rows: 3 }),
    defineField({ name: 'ogImage', title: 'Share image', type: 'image' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({ name: 'address', type: 'text', rows: 2 }),
    defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
    defineField({
      name: 'thanks',
      title: 'Application received',
      description: 'The page an applicant sees once their application is sent. Leave a field empty to keep the text shown under it.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'label', title: 'Small title', type: 'string', placeholder: 'Application received' }),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
          description: '{name} is replaced by the applicant’s first name.',
          placeholder: 'Thank you, {name}.',
        }),
        defineField({
          name: 'text',
          title: 'Text',
          type: 'text',
          rows: 3,
          placeholder: 'It’s with our scouts now. We look at every application ourselves; if there’s a fit, we’ll be in touch by email or phone to meet you.',
        }),
      ],
    }),
  ],
})
