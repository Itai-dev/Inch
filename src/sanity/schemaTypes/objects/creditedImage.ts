import { defineArrayMember, defineField } from 'sanity'

/**
 * Credit fields for any image. Shown below the image as
 * PUBLICATION / photographer NAME / stylist NAME / hair NAME / make-up NAME.
 * Kept as plain `image` (not a named type) so existing data stays valid.
 */
export const creditFields = [
  defineField({ name: 'publication', title: 'Publication / client', type: 'string', description: 'e.g. Vogue Italia, Bottega Veneta FW26' }),
  defineField({ name: 'photographer', type: 'string' }),
  defineField({ name: 'stylist', type: 'string' }),
  defineField({ name: 'hair', type: 'string' }),
  defineField({ name: 'makeup', title: 'Make-up', type: 'string' }),
  defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
]

export const creditedImage = () => defineArrayMember({ type: 'image', options: { hotspot: true }, fields: creditFields })
