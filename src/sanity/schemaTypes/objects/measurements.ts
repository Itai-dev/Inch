import { defineField, defineType } from 'sanity'

export const measurements = defineType({
  name: 'measurements',
  title: 'Measurements',
  type: 'object',
  options: { columns: 2 },
  fields: [
    defineField({ name: 'height', title: 'Height (cm)', type: 'number' }),
    defineField({ name: 'bust', title: 'Bust / Chest (cm)', type: 'number' }),
    defineField({ name: 'waist', title: 'Waist (cm)', type: 'number' }),
    defineField({ name: 'hips', title: 'Hips (cm)', type: 'number' }),
    // Written as the agency does (S, M, 38, 28/32…); always shown in capitals on the site.
    defineField({ name: 'shirt', title: 'T-shirt size', type: 'string' }),
    defineField({ name: 'shoes', title: 'Shoes (EU)', type: 'number' }),
    defineField({ name: 'pants', title: 'Pants size', type: 'string' }),
    defineField({ name: 'hair', title: 'Hair', type: 'string' }),
    defineField({ name: 'eyes', title: 'Eyes', type: 'string' }),
  ],
})
