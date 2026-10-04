import { NextResponse } from 'next/server'
import { z } from 'zod'
import { meetsCriteria } from '@/lib/apply-criteria'
import { getWriteClient } from '@/sanity/lib/client'

const num = z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().optional())

const Body = z.object({
  division: z.enum(['women', 'men']),
  name: z.string().min(1).max(120),
  age: z.coerce.number().int().min(10).max(80),
  city: z.string().max(120),
  email: z.email(),
  phone: z.string().max(40),
  guardianName: z.string().max(120).optional(),
  guardianPhone: z.string().max(40).optional(),
  height: z.coerce.number().min(100).max(230),
  bust: num, waist: num, hips: num, shoes: num,
  instagram: z.string().max(60).optional(),
  experience: z.string().max(2000).optional(),
  consent: z.literal('true'),
})

const MAX_FILES = 5
const MAX_BYTES = 8 * 1024 * 1024

export async function POST(req: Request) {
  const form = await req.formData()
  const parsed = Body.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid application' }, { status: 400 })
  const d = parsed.data

  // Server-side re-check of the pre-screen (client check is UX only).
  if (!meetsCriteria(d.division, d.age, d.height)) return NextResponse.json({ ok: true, screened: true })

  const files = form.getAll('digitals').filter((f): f is File => f instanceof File).slice(0, MAX_FILES)
  if (files.some((f) => f.size > MAX_BYTES || !f.type.startsWith('image/'))) {
    return NextResponse.json({ error: 'Invalid photos' }, { status: 400 })
  }

  const client = getWriteClient()
  if (!client) return NextResponse.json({ error: 'CMS not configured' }, { status: 503 })

  const assets = await Promise.all(
    files.map((f) => client.assets.upload('image', f, { filename: f.name, contentType: f.type })),
  )

  await client.create({
    _type: 'application',
    status: 'new',
    division: d.division,
    name: d.name,
    age: d.age,
    city: d.city,
    email: d.email,
    phone: d.phone,
    guardian: d.guardianName ? { name: d.guardianName, phone: d.guardianPhone } : undefined,
    measurements: { height: d.height, bust: d.bust, waist: d.waist, hips: d.hips, shoes: d.shoes },
    digitals: assets.map((a) => ({ _type: 'image', _key: a._id.slice(-12), asset: { _type: 'reference', _ref: a._id } })),
    instagram: d.instagram,
    experience: d.experience,
    consent: true,
  })

  // TODO: notify INCH” (e.g. Resend → APPLY_NOTIFY_EMAIL) once the email provider is chosen.

  return NextResponse.json({ ok: true })
}
