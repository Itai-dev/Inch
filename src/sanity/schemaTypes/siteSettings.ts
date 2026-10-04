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
  ],
})
