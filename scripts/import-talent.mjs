/**
 * Create or update a model in Sanity from a JSON file.
 *
 *   NEXT_PUBLIC_SANITY_PROJECT_ID=… SANITY_API_WRITE_TOKEN=… node scripts/import-talent.mjs scripts/talents/sun-mizrahi.json
 *
 * Optional: put photos in a folder next to the JSON (e.g. scripts/talents/sun-mizrahi/) —
 * `cover.*` becomes the cover, `polaroid-*` go to Polaroids, everything else to Portfolio (sorted by name).
 * Re-running updates the same document (id `talent-<slug>`); fields not in the JSON/photo folder are left alone.
 */
import { createClient } from '@sanity/client'
import { createReadStream, existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'

const [file] = process.argv.slice(2)
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const token = process.env.SANITY_API_WRITE_TOKEN
if (!file || !projectId || !token) {
  console.error('Usage: NEXT_PUBLIC_SANITY_PROJECT_ID=… SANITY_API_WRITE_TOKEN=… node scripts/import-talent.mjs <talent.json>')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-10-01',
  token,
  useCdn: false,
})

const data = JSON.parse(readFileSync(file, 'utf8'))
const photoDir = join(dirname(file), basename(file, '.json'))
const photos = existsSync(photoDir)
  ? readdirSync(photoDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()
  : []

async function upload(name) {
  const asset = await client.assets.upload('image', createReadStream(join(photoDir, name)), { filename: name })
  console.log(`  uploaded ${name}`)
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
}
const galleryItem = (img) => ({ ...img, _key: img.asset._ref.slice(-12), alt: data.name })

const coverFile = photos.find((f) => basename(f, extname(f)).toLowerCase() === 'cover')
const polaroidFiles = photos.filter((f) => f.toLowerCase().startsWith('polaroid'))
const portfolioFiles = photos.filter((f) => f !== coverFile && !polaroidFiles.includes(f))

const _id = `talent-${data.slug}`
const fields = {
  name: data.name,
  slug: { _type: 'slug', current: data.slug },
  division: data.division,
  measurements: data.measurements,
  bio: data.bio,
  instagram: data.instagram,
}
const portfolio = await Promise.all(portfolioFiles.map(upload))
const polaroids = await Promise.all(polaroidFiles.map(upload))
const cover = coverFile ? await upload(coverFile) : portfolio[0]
if (cover) fields.cover = cover
if (portfolio.length) fields.portfolio = portfolio.map(galleryItem)
if (polaroids.length) fields.polaroids = polaroids.map(galleryItem)

await client.transaction().createIfNotExists({ _id, _type: 'talent' }).patch(_id, (p) => p.set(fields)).commit()
console.log(`Saved ${data.name} (${_id}) — ${photos.length} photo(s)`)
