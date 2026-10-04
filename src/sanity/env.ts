export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-10-01'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
export const isSanityConfigured = Boolean(projectId)
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
