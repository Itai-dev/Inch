import { createClient, type QueryParams } from 'next-sanity'
import { apiVersion, dataset, isSanityConfigured, projectId } from '../env'

export const client = isSanityConfigured
  ? createClient({ projectId, dataset, apiVersion, useCdn: true })
  : null

/** Server-only client with write access (selections, applications). */
export function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!isSanityConfigured || !token) return null
  return createClient({ projectId, dataset, apiVersion, token, useCdn: false })
}

/**
 * Fetch helper. Returns `fallback` while Sanity isn't configured yet,
 * so the site builds and runs before the CMS project exists.
 */
export async function sanityFetch<T>(
  query: string,
  params: QueryParams = {},
  fallback: T,
  tags: string[] = [],
): Promise<T> {
  if (!client) return fallback
  return client.fetch<T>(query, params, { next: { revalidate: 60, tags } })
}
