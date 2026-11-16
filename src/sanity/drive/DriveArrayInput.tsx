'use client'

import { useRef, useState } from 'react'
import { Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { insert, setIfMissing, useClient, type ArrayOfObjectsInputProps } from 'sanity'
import { apiVersion } from '../env'
import { downloadFromDrive, driveEnabled, pickFromDrive } from './google'
import { DriveIcon } from './DriveIcon'

/** An arrow up into a tray, in the Studio's icon size. */
function UploadIcon() {
  return (
    <svg viewBox="0 0 25 25" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path d="M12.5 15.5v-11M8 9l4.5-4.5L17 9M5.5 15.5v4h14v-4" />
    </svg>
  )
}

const key = () => Math.random().toString(36).slice(2, 14)

type Item = { _type: string; _key: string; [k: string]: unknown }
/** How an uploaded photo becomes an item of this array: an image, or an object holding it (a magazine page). */
type Wrap = (assetId: string) => Item
const asImage: Wrap = (id) => ({ _type: 'image', _key: key(), asset: { _type: 'reference', _ref: id } })

/**
 * A gallery with two more ways in, under the list: "Upload photos" (several files at once from
 * the computer) and, once the agency's Google keys are set, "Add from Google Drive". Each photo is
 * uploaded and added at the end, in the order chosen.
 */
export function galleryInput(wrap: Wrap = asImage) {
  return function GalleryInput(props: ArrayOfObjectsInputProps) {
    const client = useClient({ apiVersion })
    const fileInput = useRef<HTMLInputElement>(null)
    const [busy, setBusy] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const addFiles = async (files: { file: () => Promise<File>; name: string; source?: { name: string; id: string } }[]) => {
      for (const [i, f] of files.entries()) {
        setBusy(`Uploading ${i + 1} of ${files.length}: ${f.name}`)
        const file = await f.file()
        const asset = await client.assets.upload('image', file, { filename: file.name, ...(f.source ? { source: f.source } : {}) })
        props.onChange([setIfMissing([]), insert([wrap(asset._id)], 'after', [-1])])
      }
    }
    const run = async (work: () => Promise<void>) => {
      setError(null)
      try {
        await work()
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBusy(null)
      }
    }

    const fromComputer = (list: FileList | null) => {
      const files = Array.from(list ?? []).filter((f) => f.type.startsWith('image/'))
      if (fileInput.current) fileInput.current.value = ''
      if (files.length) run(() => addFiles(files.map((f) => ({ name: f.name, file: async () => f }))))
    }
    const fromDrive = () =>
      run(async () => {
        setBusy('Choose photos in the Google Drive window…')
        const { files, token } = await pickFromDrive({ multiple: true })
        await addFiles(files.map((f) => ({ name: f.name, file: () => downloadFromDrive(f, token), source: { name: 'google-drive', id: f.id } })))
      })

    return (
      <Stack gap={3}>
        {props.renderDefault(props)}
        <Flex align="center" gap={2} wrap="wrap">
          <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => fromComputer(e.currentTarget.files)} />
          <Button icon={UploadIcon} text="Upload photos" mode="ghost" onClick={() => fileInput.current?.click()} disabled={!!busy || props.readOnly} />
          {driveEnabled && <Button icon={DriveIcon} text="Add from Google Drive" mode="ghost" onClick={fromDrive} disabled={!!busy || props.readOnly} />}
          {busy ? (
            <Text size={1} muted>
              {busy}
            </Text>
          ) : (
            <Text size={1} muted>
              Several at once — they’re added at the end, in order.
            </Text>
          )}
        </Flex>
        {error && (
          <Card tone="critical" padding={3} radius={2}>
            <Text size={1}>{error}</Text>
          </Card>
        )}
      </Stack>
    )
  }
}

/** Portfolio, Polaroids, the Contact page's photos. */
export const DriveArrayInput = galleryInput()
/** The magazine: each photo becomes a page. */
export const MagazinePagesInput = galleryInput((id) => ({ _type: 'page', _key: key(), image: { _type: 'image', asset: { _type: 'reference', _ref: id } } }))
