/**
 * Shrinks a photo in the browser before it's uploaded. Phone photos are 3–6 MB each and a
 * request to the site is capped at ~4.5 MB on Vercel, so a whole application only fits once
 * every photo is resized (longest side MAX_SIDE, JPEG). Decoding through <img> also reads
 * iPhone HEIC photos in Safari and respects the camera's rotation.
 */
const MAX_SIDE = 1600
const QUALITY = 0.82

/** `maxSide` and `quality` can be lowered to shrink a photo again (also takes an already shrunk blob). */
export async function shrinkPhoto(file: Blob, { maxSide = MAX_SIDE, quality = QUALITY } = {}): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas')
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) throw new Error('Could not encode')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
