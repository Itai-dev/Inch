import { NextResponse } from 'next/server'
import { z } from 'zod'
import { siteForDivision, sitePath, SITES } from '@/lib/sites'
import { siteUrl } from '@/sanity/env'
import { getWriteClient } from '@/sanity/lib/client'

const Body = z.object({
  title: z.string().max(120).optional().default(''),
  note: z.string().max(1000).optional().default(''),
  division: z.enum(['women', 'men']),
  talentIds: z.array(z.string().max(100)).min(1).max(100),
})

const shareId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10)

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid selection' }, { status: 400 })

  const client = getWriteClient()
  if (!client) return NextResponse.json({ error: 'CMS not configured' }, { status: 503 })

  const { division } = parsed.data
  const site = siteForDivision(division)
  const id = shareId()
  await client.create({
    _type: 'selection',
    shareId: id,
    division,
    title: parsed.data.title || `${SITES[site].brand} selection`,
    note: parsed.data.note,
    talents: [...new Set(parsed.data.talentIds)].map((ref) => ({ _type: 'reference', _ref: ref, _weak: true, _key: ref.slice(-12) })),
  })

  return NextResponse.json({ url: `${siteUrl}${sitePath(site, `/s/${id}`)}` })
}
