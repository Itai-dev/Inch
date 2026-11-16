'use client'

import { useState } from 'react'
import { Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { PatchEvent, set, setIfMissing, useClient, type InputProps, type SchemaType } from 'sanity'
import { apiVersion } from '../env'
import { downloadFromDrive, driveEnabled, pickFromDrive } from './google'
import { DriveIcon } from './DriveIcon'

const isImage = (t?: SchemaType): boolean => !!t && (t.name === 'image' || isImage(t.type))

/** An image field with "From Google Drive" under it: one photo picked in the Drive, uploaded and set as the field's image. */
function ImageWithDrive(props: InputProps) {
  const client = useClient({ apiVersion })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fromDrive = async () => {
    setError(null)
    try {
      setBusy('Choose a photo in the Google Drive window…')
      const { files, token } = await pickFromDrive({ multiple: false })
      if (!files.length) return
      setBusy(`Uploading ${files[0].name}`)
      const file = await downloadFromDrive(files[0], token)
      const asset = await client.assets.upload('image', file, { filename: file.name, source: { name: 'google-drive', id: files[0].id } })
      props.onChange(PatchEvent.from([setIfMissing({ _type: props.schemaType.name }), set({ _type: 'reference', _ref: asset._id }, ['asset'])]))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Stack gap={2}>
      {props.renderDefault(props)}
      <Flex align="center" gap={3}>
        <Button icon={DriveIcon} text="From Google Drive" mode="ghost" fontSize={1} padding={2} onClick={fromDrive} disabled={!!busy || props.readOnly} />
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

/** Every image field in the Studio (covers, the magazine, share image, a photo opened from a gallery…) gets the Drive button, once the agency's Google keys are set. */
export function DriveImageInput(props: InputProps) {
  if (!driveEnabled || !isImage(props.schemaType)) return props.renderDefault(props)
  return <ImageWithDrive {...props} />
}
