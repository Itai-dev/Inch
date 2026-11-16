'use client'

import { useEffect, useRef } from 'react'
import { useClient, useWorkspace } from 'sanity'
import { apiVersion } from '../env'
import { driveEnabled } from './google'

/** A Drive folder's id from its link (…/folders/<id>, …?id=<id>) or the id itself. */
export const folderIdOf = (link?: string | null) => {
  const s = (link ?? '').trim()
  if (!s) return undefined
  return s.match(/\/folders\/([\w-]+)/)?.[1] ?? s.match(/[?&]id=([\w-]+)/)?.[1] ?? (/^[\w-]{10,}$/.test(s) ? s : undefined)
}

/**
 * Where the Drive window opens: always the site's main folder (Studio › Site settings › Google Drive
 * folder), whatever was picked from last; without one, the Drive as Google opens it.
 */
export function useDriveFolder() {
  const client = useClient({ apiVersion })
  const site = useWorkspace().name
  const siteFolder = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!driveEnabled) return
    const id = `siteSettings-${site}`
    client
      .fetch<string | null>('*[_id in [$id, "drafts." + $id] && defined(driveFolder)] | order(_updatedAt desc)[0].driveFolder', { id })
      .then((link) => (siteFolder.current = folderIdOf(link)))
      .catch(() => {})
  }, [client, site])

  return {
    /** The folder to open in. */
    start: () => siteFolder.current,
  }
}
