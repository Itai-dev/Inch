'use client'

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { apiVersion, dataset, projectId } from './src/sanity/env'
import { schemaTypes } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'

export default defineConfig({
  basePath: '/studio',
  title: 'INCH” Studio',
  projectId: projectId || 'placeholder',
  dataset,
  schema: {
    types: schemaTypes,
    templates: (prev) => prev.filter((t) => !['homePage', 'siteSettings'].includes(t.schemaType)),
  },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
})
