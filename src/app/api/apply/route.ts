import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ageFrom, GUARDIAN_AGE, meetsCriteria } from '@/lib/apply-criteria'
import { getWriteClient } from '@/sanity/lib/client'

const num = z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().optional())
const opt = (max: number) => z.string().max(max).optional()

const Body = z.object({
  division: z.enum(['women', 'men']),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  country: z.string().min(1).max(120),
  email: z.email(),
  phone: z.string().max(40),
  guardianName: opt(120),
  guardianPhone: opt(40),
  guardianConsent: z.enum(['true', 'false']).optional(),
  height: z.coerce.number().min(100).max(230),
  tshirt: z.enum(['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']),
  pants: num,
  shoes: num,
  hair: opt(40),
  eyes: opt(40),
  instagram: opt(60),
  tiktok: opt(60),
  experience: opt(2000),
  consent: z.literal('true'),
  // Spam checks: a field people never see, and when the form was started.
  website: opt(200),
  startedAt: z.coerce.number().optional(),
})

// Portrait, medium, full body and profile.
const MIN_FILES = 4
const MAX_FILES = 4
// Photos are shrunk in the browser (~0.3–0.8 MB each); a request is capped at ~4.5 MB on Vercel.
const MAX_BYTES = 2.5 * 1024 * 1024
const MAX_TOTAL = 4.3 * 1024 * 1024
const MIN_FILL_MS = 8000

const key = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)

export async function POST(req: Request) {
  const form = await req.formData()
  const parsed = Body.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid application' }, { status: 400 })
  const d = parsed.data

  // Bots fill the hidden field or post instantly: answer as if it worked, keep nothing.
  if (d.website || !d.startedAt || Date.now() - d.startedAt < MIN_FILL_MS) return NextResponse.json({ ok: true })

  const age = ageFrom(d.birthdate)
  if (!(age >= 10 && age <= 80)) return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 })
  // At GUARDIAN_AGE or younger, a parent or guardian consents.
  const minor = age <= GUARDIAN_AGE
  if (minor && (!d.guardianName || !d.guardianPhone || d.guardianConsent !== 'true')) {
    return NextResponse.json({ error: 'Parent or guardian consent needed' }, { status: 400 })
  }

  const files = form.getAll('digitals').filter((f): f is File => f instanceof File).slice(0, MAX_FILES)
  const total = files.reduce((n, f) => n + f.size, 0)
  if (files.length < MIN_FILES || total > MAX_TOTAL || files.some((f) => f.size > MAX_BYTES || !f.type.startsWith('image/'))) {
    return NextResponse.json({ error: 'Invalid photos' }, { status: 400 })
  }

  const client = getWriteClient()
  if (!client) return NextResponse.json({ error: 'CMS not configured' }, { status: 503 })

  const assets = await Promise.all(
    files.map((f) => client.assets.upload('image', f, { filename: f.name, contentType: f.type })),
  )

  const name = `${d.firstName} ${d.lastName}`
  // Everyone's application is kept; the ones outside the current criteria are flagged for the scouts.
  const outsideCriteria = !meetsCriteria(d.division, age, d.height)
  await client.create({
    _type: 'application',
    status: 'new',
    division: d.division,
    name,
    birthdate: d.birthdate,
    age,
    country: d.country,
    email: d.email,
    phone: d.phone,
    guardian: minor ? { name: d.guardianName, phone: d.guardianPhone, consent: true } : undefined,
    measurements: { height: d.height, shoes: d.shoes, hair: d.hair, eyes: d.eyes },
    sizes: { tshirt: d.tshirt, pants: d.pants },
    digitals: assets.map((a) => ({ _type: 'image', _key: key(), asset: { _type: 'reference', _ref: a._id } })),
    instagram: d.instagram,
    tiktok: d.tiktok,
    experience: d.experience,
    outsideCriteria,
    consent: true,
  })

  await notify(`New application: ${name}`, [
    `${name}, ${age}, ${d.country}${minor ? ' (parent or guardian consented)' : ''}`,
    `${d.height} cm · T-shirt ${d.tshirt}${d.pants ? ` · pants ${d.pants} EU` : ''}${d.shoes ? ` · shoes ${d.shoes} EU` : ''}${outsideCriteria ? ' (outside current criteria)' : ''}`,
    `${d.email} · ${d.phone}`,
    d.instagram ? `Instagram: ${d.instagram}` : '',
    'Open the Studio → Applications to see the photos.',
  ])

  return NextResponse.json({ ok: true })
}

/** Emails the scouts through Resend, once RESEND_API_KEY and APPLY_NOTIFY_EMAIL are set. */
async function notify(subject: string, lines: string[]) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.APPLY_NOTIFY_EMAIL
  if (!apiKey || !to) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.APPLY_FROM_EMAIL || 'INCH” Applications <onboarding@resend.dev>',
      to: to.split(',').map((s) => s.trim()),
      subject,
      text: lines.filter(Boolean).join('\n'),
    }),
  }).catch(() => {})
}
