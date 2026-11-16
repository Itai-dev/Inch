'use client'

import { useState } from 'react'
import { Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { insert, setIfMissing, useClient, type ArrayOfObjectsInputProps } from 'sanity'
import { apiVersion } from '../env'
import { downloadFromDrive, driveEnabled, pickFromDrive } from './google'
import { DriveIcon } from './DriveIcon'

const key = () => Math.random().toString(36).slice(2, 14)

/**
 * A gallery (Portfolio, Polaroids, the Contact page's photos) with "Add from Google Drive":
 * several photos picked at once, each uploaded and added at the end, in the order picked.
 */
export function DriveArrayInput(props: ArrayOfObjectsInputProps) {
  const client = useClient({ apiVersion })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (!driveEnabled) return props.renderDefault(props)

  const add = async () => {
    setError(null)
    try {
      setBusy('Choose photos in the Google Drive window…')
      const { files, token } = await pickFromDrive({ multiple: true })
      for (const [i, f] of files.entries()) {
        setBusy(`Adding ${i + 1} of ${files.length}: ${f.name}`)
        const file = await downloadFromDrive(f, token)
        const asset = await client.assets.upload('image', file, { filename: file.name, source: { name: 'google-drive', id: f.id } })
        props.onChange([setIfMissing([]), insert([{ _type: 'image', _key: key(), asset: { _type: 'reference', _ref: asset._id } }], 'after', [-1])])
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Stack gap={3}>
      {props.renderDefault(props)}
      <Flex align="center" gap={3}>
        <Button icon={DriveIcon} text="Add from Google Drive" mode="ghost" onClick={add} disabled={!!busy || props.readOnly} />
        {busy && (
          <Text size={1} muted>
            {busy}
          </Text>
        )}
      </Flex>
      {error && (
        <Card tone="critical" padding={3} radius={2}>
          <Text size={1}>Google Drive: {error}</Text>
        </Card>
      )}
    </Stack>
  )
}
