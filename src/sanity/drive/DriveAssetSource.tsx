'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, Button, Dialog, Flex, Spinner, Stack, Text } from '@sanity/ui'
import type { AssetSource, AssetSourceComponentProps } from 'sanity'
import { downloadFromDrive, pickFromDrive } from './google'
import { DriveIcon } from './DriveIcon'

/** One photo from Google Drive into an image field (its menu: Select → Google Drive). */
function DrivePicker({ onClose, onSelect }: AssetSourceComponentProps) {
  const [state, setState] = useState<{ step: 'picking' | 'downloading' | 'error'; message?: string }>({ step: 'picking' })
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    pickFromDrive({ multiple: false })
      .then(async ({ files, token }) => {
        if (!files.length) return onClose()
        setState({ step: 'downloading', message: files[0].name })
        const file = await downloadFromDrive(files[0], token)
        onSelect([{ kind: 'file', value: file as never, assetDocumentProps: { originalFilename: file.name, source: { name: 'google-drive', id: files[0].id } } as never }])
      })
      .catch((e: Error) => setState({ step: 'error', message: e.message }))
  }, [onClose, onSelect])

  return (
    <Dialog id="google-drive" header="Google Drive" onClose={onClose} width={1}>
      <Box padding={4}>
        {state.step === 'error' ? (
          <Stack gap={4}>
            <Text>Google Drive didn’t open: {state.message}</Text>
            <Flex justify="flex-end">
              <Button text="Close" mode="ghost" onClick={onClose} />
            </Flex>
          </Stack>
        ) : (
          <Flex align="center" gap={3}>
            <Spinner muted />
            <Text muted>{state.step === 'picking' ? 'Choose a photo in the Google Drive window…' : `Bringing in ${state.message}…`}</Text>
          </Flex>
        )}
      </Box>
    </Dialog>
  )
}

export const driveAssetSource: AssetSource = {
  name: 'google-drive',
  title: 'Google Drive',
  icon: DriveIcon,
  component: DrivePicker,
}
