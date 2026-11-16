'use client'

import { useRef, useState } from 'react'
import { Button, Card, Grid, Stack, Text } from '@sanity/ui'
import { Menu, MenuButton, MenuItem } from '@sanity/ui/menu'
import { type ArrayInputFunctionsProps, type ArrayOfObjectsInputProps, type ArraySchemaType, useClient } from 'sanity'
import { apiVersion } from '../env'
import { downloadFromDrive, driveEnabled, pickFromDrive } from './google'
import { useDriveFolder } from './folder'
import { DriveIcon } from './DriveIcon'

const key = () => Math.random().toString(36).slice(2, 14)

/** A plus, in the Studio's icon size. */
function AddIcon() {
  return (
    <svg viewBox="0 0 25 25" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path d="M12.5 5.5v14M5.5 12.5h14" />
    </svg>
  )
}

type Item = { _type: string; _key: string; [k: string]: unknown }
/** How an uploaded photo becomes an item of this array: an image, or an object holding it (a magazine page). */
type Wrap = (assetId: string) => Item
const asImage: Wrap = (id) => ({ _type: 'image', _key: key(), asset: { _type: 'reference', _ref: id } })
type Source = { name: string; file: () => Promise<File>; source?: { name: string; id: string } }

/**
 * The array's own "Add item", choosing several photos at once (from the computer, or Google Drive
 * once its keys are set). Each is uploaded and added at the end, in the order chosen. `kinds`: the
 * array's other item types (the magazine's Page and Spread), still offered one at a time.
 */
function addItems(wrap: Wrap, kinds: { name: string; title: string }[]) {
  return function AddItems(props: ArrayInputFunctionsProps<Item, ArraySchemaType>) {
    const client = useClient({ apiVersion })
    const fileInput = useRef<HTMLInputElement>(null)
    const folder = useDriveFolder()
    const [busy, setBusy] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const upload = async (files: Source[]) => {
      for (const [i, f] of files.entries()) {
        setBusy(`Uploading ${i + 1} of ${files.length}: ${f.name}`)
        const file = await f.file()
        const asset = await client.assets.upload('image', file, { filename: file.name, ...(f.source ? { source: f.source } : {}) })
        props.onItemAppend(wrap(asset._id))
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
      if (files.length) run(() => upload(files.map((f) => ({ name: f.name, file: async () => f }))))
    }
    const fromDrive = () =>
      run(async () => {
        setBusy('Choose photos in the Google Drive window…')
        const { files, token } = await pickFromDrive({ multiple: true, folderId: folder.start() })
        folder.remember(files[0]?.parentId)
        await upload(files.map((f) => ({ name: f.name, file: () => downloadFromDrive(f, token), source: { name: 'google-drive', id: f.id } })))
      })
    const pick = () => fileInput.current?.click()
    const one = (name: string) => {
      const type = props.schemaType.of.find((t) => t.name === name)
      if (type) props.onItemAppend(props.onValueCreate(type as never))
    }

    // Read-only (or still loading): the button stays in its place, off.
    const disabled = !!busy || !!props.readOnly
    // Only "Add item" → the computer's file chooser (several at once); with Drive or other kinds, a menu.
    const menu = driveEnabled || kinds.length > 0
    return (
      <Stack gap={2}>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => fromComputer(e.currentTarget.files)} />
        <Grid>
          {menu ? (
            <MenuButton
              id={`add-${props.path.join('-')}`}
              button={<Button icon={AddIcon} text={busy ?? 'Add item…'} mode="ghost" disabled={disabled} />}
              menu={
                <Menu>
                  <MenuItem text={kinds.length ? 'Photos — a page each (several at once)' : 'Photos from the computer (several at once)'} onClick={pick} />
                  {driveEnabled && <MenuItem icon={DriveIcon} text="Photos from Google Drive (several at once)" onClick={fromDrive} />}
                  {kinds.map((k) => (
                    <MenuItem key={k.name} text={k.title} onClick={() => one(k.name)} />
                  ))}
                </Menu>
              }
              popover={{ portal: true, constrainSize: true }}
            />
          ) : (
            <Button icon={AddIcon} text={busy ?? 'Add item'} mode="ghost" onClick={pick} disabled={disabled} />
          )}
        </Grid>
        {error && (
          <Card tone="critical" padding={3} radius={2}>
            <Text size={1}>{error}</Text>
          </Card>
        )}
      </Stack>
    )
  }
}

function galleryInput(wrap: Wrap, kinds: { name: string; title: string }[] = []) {
  const Functions = addItems(wrap, kinds)
  return function GalleryInput(props: ArrayOfObjectsInputProps) {
    return props.renderDefault({ ...props, arrayFunctions: Functions as never })
  }
}

/** Portfolio, Polaroids, the Contact page's photos: "Add item" takes several photos at once. */
export const DriveArrayInput = galleryInput(asImage)
/** The magazine: "Add item…" → several photos (a page each), or one Page / Spread. */
export const MagazinePagesInput = galleryInput(
  (id) => ({ _type: 'page', _key: key(), image: { _type: 'image', asset: { _type: 'reference', _ref: id } } }),
  [
    { name: 'page', title: 'Page (a photo or a name)' },
    { name: 'spread', title: 'Spread (both pages)' },
  ],
)
