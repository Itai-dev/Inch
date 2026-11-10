import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * One per site: documents `siteSettings-inch` and `siteSettings-dot`. The contact details are the
 * only place they are written: the footer, the contact page, the menu, booking emails and the comp
 * cards all read them from here (`getSettings`). On DOT. a detail left empty uses INCH”'s.
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Contact & settings',
  type: 'document',
  groups: [
    { name: 'contact', title: 'Contact details', default: true },
    { name: 'contactPage', title: 'Contact page' },
    { name: 'apply', title: 'Application received' },
    { name: 'seo', title: 'Google & sharing' },
  ],
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      description: 'The one address used everywhere: the footer, the contact page, the menu, booking enquiries, the apply page and the comp cards. (On DOT.: empty = INCH”’s.)',
      type: 'string',
      group: 'contact',
      placeholder: 'hello@inch-mgmt.com',
      validation: (r) => r.email(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      description: 'As it should be read, e.g. +972 3 555 0142. Footer, contact page and comp cards.',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      description: 'Two short lines. Footer and contact page.',
      type: 'text',
      rows: 2,
      group: 'contact',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram link',
      description: 'The whole link, e.g. https://instagram.com/inch.mgmt',
      type: 'url',
      group: 'contact',
    }),
    defineField({
      name: 'hours',
      title: 'Opening hours',
      type: 'string',
      group: 'contact',
      placeholder: 'Sunday – Thursday, 10:00 – 18:00',
    }),
    defineField({
      name: 'contactImages',
      title: 'Contact page pictures',
      description: 'The pile of prints on the contact page: eight are shown, in this order (the first at the bottom of the pile, the last on top). Fewer than eight are repeated; empty = pictures of the models on the board.',
      type: 'array',
      group: 'contactPage',
      options: { layout: 'grid' },
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Alt text', description: 'What is in the picture, for screen readers.', type: 'string' })],
        }),
      ],
    }),
    defineField({
      name: 'thanks',
      title: 'Application received',
      description: 'The page an applicant sees once their application is sent. Leave a field empty to keep the text shown under it.',
      type: 'object',
      group: 'apply',
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
    defineField({ name: 'title', title: 'Site title', description: 'The browser tab and Google. Empty = “INCH” — Model Management”.', type: 'string', group: 'seo' }),
    defineField({ name: 'description', title: 'Description', description: 'One or two sentences under the title on Google and when the site is shared.', type: 'text', rows: 3, group: 'seo' }),
    defineField({ name: 'ogImage', title: 'Share image', description: 'Shown when the site is shared (WhatsApp, Instagram, …). Landscape, about 1200 × 630.', type: 'image', group: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Contact & settings' }) },
})
