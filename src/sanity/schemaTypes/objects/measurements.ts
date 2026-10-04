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
    defineField({ name: 'shoes', title: 'Shoes (EU)', type: 'number' }),
    defineField({ name: 'hair', title: 'Hair', type: 'string' }),
    defineField({ name: 'eyes', title: 'Eyes', type: 'string' }),
  ],
})
