import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export const dynamic = 'force-static'
import type { Metadata } from 'next'
import { metadata as studioMetadata } from 'next-sanity/studio'
export { viewport } from 'next-sanity/studio'

export const metadata: Metadata = {
  ...studioMetadata,
  title: 'INCH” · DOT. Studio',
  icons: { icon: [{ url: '/icons/inch.svg', type: 'image/svg+xml' }, { url: '/icons/inch-32.png', sizes: '32x32' }], apple: '/icons/inch-180.png' },
}

export default function StudioPage() {
  return <NextStudio config={config} />
}
