import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ADULT_AGE, ageFrom, MIN_APPLY_AGE, meetsCriteria } from '@/lib/apply-criteria'
import { applicationEmail } from '@/lib/application-email'
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

// Four photos go up to the Studio and out by email: give it a minute (Vercel's default can be 10 s).
export const maxDuration = 60

export async function POST(req: Request) {
  const form = await req.formData().catch((e) => {
    console.error('[apply] Could not read the form', e)
    return null
  })
  if (!form) return NextResponse.json({ error: 'Could not read the application' }, { status: 400 })
  const parsed = Body.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')))
  if (!parsed.success) {
    // Which fields, in the deployment's logs.
    const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0] ?? '')))].filter(Boolean)
    console.error('[apply] Invalid application', parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '))
    // Which fields, so the applicant can put them right.
    return NextResponse.json({ error: `please check ${fields.join(', ') || 'the form'}` }, { status: 400 })
  }
  const d = parsed.data

  // Bots fill the hidden field or post instantly: answer as if it worked, keep nothing.
  if (d.website || !d.startedAt || Date.now() - d.startedAt < MIN_FILL_MS) return NextResponse.json({ ok: true })

  const age = ageFrom(d.birthdate)
  if (!(age >= 0 && age <= 80)) return NextResponse.json({ error: Number.isFinite(age) ? `date of birth: that would make you ${age}` : 'date of birth' }, { status: 400 })
  if (age < MIN_APPLY_AGE) return NextResponse.json({ error: `applicants must be at least ${MIN_APPLY_AGE}` }, { status: 400 })
  // Under ADULT_AGE, a parent or guardian consents.
  const minor = age < ADULT_AGE
  if (minor && (!d.guardianName || !d.guardianPhone || d.guardianConsent !== 'true')) {
    return NextResponse.json({ error: 'Parent or guardian consent needed' }, { status: 400 })
  }

  const files = form.getAll('digitals').filter((f): f is File => f instanceof File).slice(0, MAX_FILES)
  const total = files.reduce((n, f) => n + f.size, 0)
  if (files.length < MIN_FILES || total > MAX_TOTAL || files.some((f) => f.size > MAX_BYTES || !f.type.startsWith('image/'))) {
    console.error('[apply] Invalid photos', files.map((f) => `${f.name} ${f.type} ${f.size}B`).join(', '))
    return NextResponse.json({ error: files.length < MIN_FILES ? 'Four photos are needed' : 'The photos are too large' }, { status: 400 })
  }

  const name = `${d.firstName} ${d.lastName}`
  // Everyone's application is kept; the ones outside the current criteria are flagged for the scouts.
  const outsideCriteria = !meetsCriteria(d.division, age, d.height)

  // Kept in the Studio when it can write (SANITY_API_WRITE_TOKEN), and emailed to the scouts
  // with the photos attached. Either is enough; with neither, the applicant is told to try again.
  const client = getWriteClient()
  // The Studio's copies of the photos, when it saved them (their URLs go in the email).
  let studioUrls: string[] = []
  const saved = client
    ? await (async () => {
        const assets = await Promise.all(files.map((f) => client.assets.upload('image', f, { filename: f.name, contentType: f.type })))
        studioUrls = assets.map((a) => a.url)
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
        return true
      })().catch((e) => {
        console.error('[apply] Saving to the Studio failed', e)
        return false
      })
    : false

  const board = d.division === 'men' ? 'DOT. Men' : 'INCH” Women'
  const POSES: Record<string, string> = { portrait: 'Portrait', medium: 'Medium', 'full-body': 'Full body', profile: 'Profile' }
  const photos = await Promise.all(
    files.map(async (f, i) => {
      const pose = (f.name || '').replace(/\.[a-z]+$/i, '')
      return {
        label: POSES[pose] ?? `Photo ${i + 1}`,
        filename: f.name || `photo-${i + 1}.jpg`,
        content: Buffer.from(await f.arrayBuffer()).toString('base64'),
        url: studioUrls[i],
      }
    }),
  )
  const mail = applicationEmail({
    board,
    name,
    rows: [
      ['Board', board],
      ['Age', `${age} (born ${d.birthdate})`],
      ['Country', d.country],
      ['Email', d.email],
      ['Phone', d.phone],
      ['Parent or guardian', minor ? `${d.guardianName}, ${d.guardianPhone} — consented` : undefined],
      ['Height', `${d.height} cm`],
      ['T-shirt', d.tshirt],
      ['Pants', d.pants ? `${d.pants} EU` : undefined],
      ['Shoes', d.shoes ? `${d.shoes} EU` : undefined],
      ['Hair', d.hair],
      ['Eyes', d.eyes],
      ['Instagram', d.instagram && `@${d.instagram.replace(/^@+/, '')}`],
      ['TikTok', d.tiktok && `@${d.tiktok.replace(/^@+/, '')}`],
    ],
    experience: d.experience,
    flags: [outsideCriteria ? 'Outside current criteria' : '', minor ? 'Minor — guardian consented' : ''].filter(Boolean),
    photos,
    savedInStudio: saved && studioUrls.length === photos.length,
  })
  const emailed = await notify(`New application (${board}): ${name}`, mail, d.email)

  // No email set up yet (no RESEND_API_KEY) and the Studio didn't take it: the site isn't live, so
  // finish the flow and say plainly that it wasn't delivered, rather than an error nobody can act on.
  if (!saved && !process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, unsent: true })
  if (!saved && !emailed) return NextResponse.json({ error: 'Could not deliver the application' }, { status: 503 })
  return NextResponse.json({ ok: true })
}

/** Where applications go until the agency's own address is set in APPLY_NOTIFY_EMAIL (Vercel). */
// TODO: the agency's scouting address.
const DEFAULT_TO = 'itaiagami@gmail.com'

/** Emails the scouts through Resend (RESEND_API_KEY): the form laid out, the photos with it. True once sent. */
async function notify(subject: string, mail: ReturnType<typeof applicationEmail>, replyTo: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false
  const to = (process.env.APPLY_NOTIFY_EMAIL || DEFAULT_TO).split(',').map((s) => s.trim())
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.APPLY_FROM_EMAIL || 'INCH” Applications <onboarding@resend.dev>',
      to,
      reply_to: replyTo,
      subject,
      text: mail.text,
      html: mail.html,
      attachments: mail.attachments,
    }),
  }).catch((e) => {
    console.error('[apply] Resend request failed', e)
    return null
  })
  // Shown in the deployment's logs, e.g. a sender Resend won't allow yet.
  if (res && !res.ok) console.error('[apply] Resend refused the email', res.status, await res.text().catch(() => ''))
  return !!res?.ok
}
