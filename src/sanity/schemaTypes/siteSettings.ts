import { defineField, defineType } from 'sanity'

/** One per site: documents `siteSettings-inch` and `siteSettings-dot`. SEO, sharing and the application's thanks; contact details are on the Contact page. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Site title', type: 'string' }),
    defineField({ name: 'description', title: 'SEO description', description: 'What search engines show under the site’s name.', type: 'text', rows: 3 }),
    defineField({
      name: 'driveFolder',
      title: 'Google Drive folder',
      description:
        'The link of the Drive folder with this site’s models (open the folder in Google Drive and copy its address). “From Google Drive” opens there; after the first photos for a model, it opens in her own folder.',
      type: 'url',
      placeholder: 'https://drive.google.com/drive/folders/…',
    }),
    defineField({ name: 'ogImage', title: 'Share image', description: 'Shown when a link to the site is shared (WhatsApp, social). 1200 × 630.', type: 'image' }),
    // Contact details moved to the Contact page: these older ones show only while they still hold something (the Contact page's win).
    defineField({ name: 'email', title: 'Email (old — now on Contact page)', type: 'string', hidden: ({ value }) => !value }),
    defineField({ name: 'phone', title: 'Phone (old — now on Contact page)', type: 'string', hidden: ({ value }) => !value }),
    defineField({ name: 'address', title: 'Address (old — now on Contact page)', type: 'text', rows: 2, hidden: ({ value }) => !value }),
    defineField({ name: 'instagram', title: 'Instagram (old — now on Contact page)', type: 'url', hidden: ({ value }) => !value }),
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
          placeholder: 'We’ve received your application. If there’s a fit, we’ll be in touch by email or phone.\n\nAlready applied and haven’t heard from us yet? No need to send it again — we’re on it.',
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
