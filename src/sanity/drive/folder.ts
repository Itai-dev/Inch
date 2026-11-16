'use client'

import { useEffect, useRef } from 'react'
import { useClient, useFormValue, useWorkspace } from 'sanity'
import { apiVersion } from '../env'
import { driveEnabled } from './google'

/** A Drive folder's id from its link (…/folders/<id>, …?id=<id>) or the id itself. */
export const folderIdOf = (link?: string | null) => {
  const s = (link ?? '').trim()
  if (!s) return undefined
  return s.match(/\/folders\/([\w-]+)/)?.[1] ?? s.match(/[?&]id=([\w-]+)/)?.[1] ?? (/^[\w-]{10,}$/.test(s) ? s : undefined)
}

const KEY = 'inch-drive-folder:'
const recall = (id: string) => {
  try {
    return localStorage.getItem(KEY + id) || undefined
  } catch {
    return undefined
  }
}

/**
 * Where the Drive window opens for the document being edited: the folder last picked from for it
 * (remembered in this browser: a model's own folder, after the first time), else the site's folder
 * (Studio › Site settings › Google Drive folder), else the Drive as Google opens it.
 */
export function useDriveFolder() {
  const client = useClient({ apiVersion })
  const site = useWorkspace().name
  const docId = String(useFormValue(['_id']) ?? '').replace(/^drafts\./, '')
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
    start: () => (docId && recall(docId)) || siteFolder.current,
    /** After a pick: this document's folder from now on. */
    remember: (folderId?: string) => {
      if (!docId || !folderId) return
      try {
        localStorage.setItem(KEY + docId, folderId)
      } catch {}
    },
  }
}
