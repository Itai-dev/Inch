'use client'

import { visionTool } from '@sanity/vision'
import { defineConfig, type WorkspaceOptions } from 'sanity'
import { structureTool } from 'sanity/structure'
import { SITE_KEYS, SITES, type Site } from './src/lib/sites'
import { apiVersion, dataset, projectId } from './src/sanity/env'
import { schemaTypes } from './src/sanity/schemaTypes'
import { structureFor } from './src/sanity/structure'

const DIVIDED_TYPES = ['talent', 'category', 'application', 'selection']
const TEMPLATE_TITLES: Record<string, string> = { talent: 'Model', category: 'Category', application: 'Application', selection: 'Shared selection' }

/** One workspace per site: /studio/inch and /studio/dot. Same dataset, filtered by division. */
const workspace = (site: Site): WorkspaceOptions => {
  const { brand, label, division } = SITES[site]
  return {
    name: site,
    title: brand,
    subtitle: label,
    basePath: `/studio/${site}`,
    projectId: projectId || 'placeholder',
    dataset,
    schema: {
      types: schemaTypes,
      // New documents are created in this site's division.
      templates: (prev) => [
        ...prev.filter((t) => !DIVIDED_TYPES.includes(t.schemaType) && !['homePage', 'siteSettings'].includes(t.schemaType)),
        ...DIVIDED_TYPES.map((type) => ({ id: `${type}-${site}`, title: TEMPLATE_TITLES[type], schemaType: type, value: { division } })),
      ],
    },
    document: {
      // Applications and selections come from the website; editors create models and categories.
      newDocumentOptions: (prev) => prev.filter((t) => t.templateId === `talent-${site}` || t.templateId === `category-${site}`),
    },
    plugins: [structureTool({ structure: structureFor(site) }), visionTool({ defaultApiVersion: apiVersion })],
  }
}

export default defineConfig(SITE_KEYS.map(workspace))
