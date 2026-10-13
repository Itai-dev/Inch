'use client'

/**
 * Become a model: an opening screen, then four steps — 01 You (and a guardian for
 * under-18s), 02 Measurements, 03 Digitals, 04 Send — with a comp card that fills in as
 * the form does, and the INCH” ruler as the progress bar. Photos are shrunk in the
 * browser before upload so a whole application fits in one request.
 */
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { NameOpen } from '@/components/motion/NameOpen'
import { Ruler } from '@/components/motion/Ruler'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { ageFrom, GUARDIAN_AGE } from '@/lib/apply-criteria'
import { shrinkPhoto } from '@/lib/shrink-photo'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { cmToFeet } from '@/lib/units'
import { CompCard, type CardStat } from './CompCard'
import { HeightTape } from './HeightTape'
import { Silhouette, type Pose } from './Silhouette'

type Data = {
  firstName: string
  lastName: string
  birthdate: string
  city: string
  email: string
  phone: string
  guardianName: string
  guardianPhone: string
  height: number | null
  bust: string
  waist: string
  hips: string
  shoes: string
  hair: string
  eyes: string
  instagram: string
  tiktok: string
  experience: string
  consent: boolean
}

type Step = 'intro' | 'you' | 'guardian' | 'measure' | 'digitals' | 'send' | 'done'
type Photo = { blob: Blob; url: string }

const initial: Data = {
  firstName: '', lastName: '', birthdate: '', city: '', email: '', phone: '', guardianName: '', guardianPhone: '',
  height: null, bust: '', waist: '', hips: '', shoes: '', hair: '', eyes: '', instagram: '', tiktok: '', experience: '', consent: false,
}

const SLOTS: { pose: Pose; label: string; hint: string; optional?: boolean }[] = [
  { pose: 'close-up', label: 'Close-up', hint: 'Face, straight on' },
  { pose: 'profile', label: 'Profile', hint: 'Turn to the side' },
  { pose: 'full-length', label: 'Full length', hint: 'Head to toe' },
  { pose: 'style', label: 'Your style', hint: 'An outfit you love', optional: true },
]

/** Step numbers on the ruler (the guardian step belongs to 01). */
const NUMBER: Partial<Record<Step, number>> = { you: 1, guardian: 1, measure: 2, digitals: 3, send: 4 }
const TITLE: Partial<Record<Step, string>> = { you: 'About you', guardian: 'A parent or guardian', measure: 'Measurements', digitals: 'Digitals', send: 'Last thing' }

const narrow = { fontStretch: '80%' } as const
const big =
  'w-full border-b-2 border-fg bg-transparent pb-2 text-[clamp(22px,2.3vw,32px)] font-semibold outline-none placeholder:text-muted/40 placeholder-shown:border-line focus:border-fg'
const mid = 'w-full border-b-2 border-fg bg-transparent pb-1.5 text-[clamp(20px,1.8vw,26px)] font-semibold outline-none placeholder:text-muted/40 placeholder-shown:border-line focus:border-fg'

function Field({ label, hint, className = '', children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[12px] font-bold uppercase tracking-[0.04em]" style={narrow}>{label}</span>
      {children}
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </label>
  )
}

export function ApplyFunnel({ site, image, scoutingEmail }: { site: Site; image?: string; scoutingEmail?: string }) {
  const { brand, division, label } = SITES[site]
  const reduced = useReducedMotion()
  const [step, setStep] = useState<Step>('intro')
  const [furthest, setFurthest] = useState(0)
  const [d, setD] = useState<Data>(initial)
  const [photos, setPhotos] = useState<Partial<Record<Pose, Photo>>>({})
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedAt = useRef(0)
  const set = <K extends keyof Data>(k: K, v: Data[K]) => setD((p) => ({ ...p, [k]: v }))

  const age = d.birthdate ? ageFrom(d.birthdate) : NaN
  const isMinor = age >= 0 && age < GUARDIAN_AGE
  const flow: Step[] = useMemo(() => ['you', ...(isMinor ? (['guardian'] as Step[]) : []), 'measure', 'digitals', 'send'], [isMinor])
  const index = flow.indexOf(step)
  const number = NUMBER[step] ?? 0

  const go = (s: Step) => {
    setStep(s)
    setFurthest((f) => Math.max(f, NUMBER[s] ?? 0))
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }
  const next = () => go(flow[index + 1])
  const back = () => go(index > 0 ? flow[index - 1] : 'intro')

  async function addPhoto(pose: Pose, file?: File) {
    if (!file) return
    setPhotoError(null)
    try {
      const blob = await shrinkPhoto(file)
      setPhotos((p) => {
        if (p[pose]) URL.revokeObjectURL(p[pose].url)
        return { ...p, [pose]: { blob, url: URL.createObjectURL(blob) } }
      })
    } catch {
      setPhotoError('We couldn’t read that photo. Try a JPG or PNG.')
    }
  }

  async function submit() {
    setSending(true)
    setError(null)
    const fd = new FormData(document.getElementById('apply-trap') as HTMLFormElement)
    Object.entries(d).forEach(([k, v]) => fd.append(k, v === null ? '' : String(v)))
    fd.append('division', division)
    fd.append('startedAt', String(startedAt.current))
    SLOTS.forEach((s) => {
      const p = photos[s.pose]
      if (p) fd.append('digitals', p.blob, `${s.pose}.jpg`)
    })
    const res = await fetch('/api/apply', { method: 'POST', body: fd }).catch(() => null)
    setSending(false)
    if (res?.ok) go('done')
    else setError(`Something went wrong. Please try again${scoutingEmail ? `, or write to ${scoutingEmail}` : ''}.`)
  }

  // The comp card, filled in as far as the form is.
  const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ')
  const stats: CardStat[] = [
    ['Age', Number.isFinite(age) && age > 0 ? age : undefined],
    ['City', d.city],
    ['Height', d.height ?? undefined],
    [division === 'men' ? 'Chest' : 'Bust', d.bust],
    ['Waist', d.waist],
    ['Hips', d.hips],
    ['Shoes', d.shoes],
    ['Hair', d.hair],
    ['Eyes', d.eyes],
  ]
  const card = (className = '') => (
    <CompCard
      brand={brand}
      division={division}
      name={fullName}
      stats={stats}
      photos={SLOTS.slice(0, 3).map((s) => ({ label: s.label, url: photos[s.pose]?.url }))}
      contact={[d.email || 'Email —', d.instagram ? `@${d.instagram.replace('@', '')}` : 'Instagram —']}
      className={className}
    />
  )

  // Spam trap: a field people never see, and a minimum time to fill the form (checked on the server).
  const trap = (
    <form id="apply-trap" aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </form>
  )

  if (step === 'intro')
    return (
      <div className="grid gap-10 px-gutter pb-16 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-[clamp(32px,6vw,96px)] md:pt-10">
        {image && (
          <div className="relative aspect-[3/4] max-h-[78dvh] w-full overflow-hidden bg-line md:justify-self-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
          </div>
        )}
        <div className={`flex max-w-[560px] flex-col gap-7 ${image ? '' : 'md:col-span-2'}`}>
          <p className="label text-muted">Become a model · {brand} {label}</p>
          <NameOpen name="Get scouted" division={division} className="wordmark text-[clamp(56px,8vw,120px)] uppercase" />
          <div className="flex flex-col gap-3 text-[17px] leading-snug">
            <p>No experience needed. We look at every application ourselves.</p>
            <p className="text-muted">
              You’ll need three photos taken today: phone photos by a friend are perfect. Daylight, no make-up, hair back, fitted clothes.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                startedAt.current = Date.now()
                go('you')
              }}
              className="h-14 bg-fg px-8 text-[15px] font-bold uppercase tracking-[0.04em] text-bg hover:opacity-85"
              style={narrow}
            >
              Start →
            </button>
            <span className="text-[13px] text-muted">Takes about 3 minutes</span>
          </div>
        </div>
      </div>
    )

  if (step === 'done')
    return (
      <div className="grid gap-10 px-gutter pb-16 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] md:gap-[clamp(32px,6vw,96px)] md:pt-10">
        <div className="flex max-w-[560px] flex-col gap-6">
          <p className="label text-muted">Application sent</p>
          <h1 className="wordmark text-[clamp(48px,6vw,84px)] uppercase">Thank you{d.firstName ? `, ${d.firstName}` : ''}.</h1>
          <p className="text-[17px] leading-snug">Our scouts look at every application. If there’s a fit, we’ll contact you by email or phone.</p>
          {scoutingEmail && <p className="text-[14px] text-muted">Questions? Write to <a href={`mailto:${scoutingEmail}`} className="underline">{scoutingEmail}</a>.</p>}
          <Link href={sitePath(site)} className="text-[14px] font-bold uppercase underline" style={narrow}>Back to {brand}</Link>
        </div>
        {card()}
      </div>
    )

  const heading = (
    <div className="flex flex-col gap-3">
      <p className="label text-muted">Become a model · {brand} {label} · 0{number} / 04</p>
      <h1 className="wordmark text-[clamp(48px,6vw,84px)] uppercase">{TITLE[step]}</h1>
    </div>
  )
  const nav = (submitLabel = 'Continue →', disabled = false, note?: string) => (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pt-2">
      <button type="submit" disabled={disabled} className="h-14 bg-fg px-8 text-[15px] font-bold uppercase tracking-[0.04em] text-bg hover:opacity-85 disabled:opacity-40" style={narrow}>
        {submitLabel}
      </button>
      <button type="button" onClick={back} className="text-[14px] font-bold uppercase text-muted hover:text-fg" style={narrow}>
        Back
      </button>
      {note && <span className="text-[13px] text-muted">{note}</span>}
    </div>
  )

  return (
    <div className="flex flex-col">
      {trap}
      {/* Phones: the comp card folds into a strip above the form. */}
      <details className="mx-gutter mt-4 bg-surface md:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3">
          <span className="flex shrink-0 gap-0.5">
            {SLOTS.slice(0, 3).map((s) => (
              <span key={s.pose} className="relative block h-[29px] w-[22px] overflow-hidden border border-dashed border-muted/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photos[s.pose] && <img src={photos[s.pose]!.url} alt="" className="absolute inset-0 size-full object-cover" />}
              </span>
            ))}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="wordmark truncate text-[18px] uppercase">{fullName ? `’${fullName}’` : 'Your comp card'}</span>
            <span className="truncate text-[11px] uppercase text-muted">
              {[Number.isFinite(age) && age > 0 ? age : null, d.city, d.height ? `${d.height} cm` : null].filter(Boolean).join(' · ') || 'Fills in as you go'}
            </span>
          </span>
          <span className="ml-auto text-[11px] font-bold uppercase" style={narrow}>Card</span>
        </summary>
        <div className="px-3.5 pb-3.5">{card('p-0! bg-transparent!')}</div>
      </details>

      <div className="grid gap-10 px-gutter pb-8 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] md:gap-[clamp(32px,6vw,96px)] md:pt-10">
        <div className="flex max-w-[640px] flex-col gap-8">
          {heading}

          {step === 'you' && (
            <form className="grid grid-cols-1 gap-x-7 gap-y-7 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); next() }}>
              <Field label="First name"><input required autoComplete="given-name" className={big} value={d.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
              <Field label="Last name"><input required autoComplete="family-name" className={big} value={d.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
              <Field label="Date of birth" hint={Number.isFinite(age) && age > 0 ? `${age} years old` : undefined}>
                <input required type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} className={big} value={d.birthdate} onChange={(e) => set('birthdate', e.target.value)} />
              </Field>
              <Field label="City"><input required autoComplete="address-level2" className={big} value={d.city} onChange={(e) => set('city', e.target.value)} /></Field>
              <Field label="Email"><input required type="email" autoComplete="email" placeholder="you@email.com" className={big} value={d.email} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Phone"><input required type="tel" autoComplete="tel" placeholder="+972" className={big} value={d.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              <p className="sm:col-span-2 text-[13px] text-muted">Under {GUARDIAN_AGE}? We’ll ask for a parent or guardian next.</p>
              <div className="sm:col-span-2">{nav('Continue →', false, 'Takes about 3 minutes')}</div>
            </form>
          )}

          {step === 'guardian' && (
            <form className="grid grid-cols-1 gap-x-7 gap-y-7 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); next() }}>
              <p className="sm:col-span-2 text-[16px] leading-snug">You’re under {GUARDIAN_AGE}, so we’ll speak to a parent or guardian first.</p>
              <Field label="Their name"><input required className={big} value={d.guardianName} onChange={(e) => set('guardianName', e.target.value)} /></Field>
              <Field label="Their phone"><input required type="tel" className={big} value={d.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} /></Field>
              <div className="sm:col-span-2">{nav()}</div>
            </form>
          )}

          {step === 'measure' && (
            <form className="flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); if (d.height) next() }}>
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold uppercase tracking-[0.04em]" style={narrow}>Height</span>
                <div className="flex items-baseline gap-2.5">
                  <span className="wordmark text-[clamp(64px,7vw,96px)] tabular-nums">{d.height ?? '—'}</span>
                  <span className="text-[22px] font-bold">cm</span>
                  {d.height && <span className="ml-2 text-[14px] text-muted">{cmToFeet(d.height)}</span>}
                </div>
                <HeightTape value={d.height} onChange={(cm) => set('height', cm)} />
                <span className="text-[12px] text-muted">{d.height ? 'Drag the tape, or use the arrow keys.' : 'Drag the tape to your height.'}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                <Field label={division === 'men' ? 'Chest (cm)' : 'Bust (cm)'}><input required inputMode="numeric" className={mid} value={d.bust} onChange={(e) => set('bust', e.target.value.replace(/[^\d.]/g, ''))} /></Field>
                <Field label="Waist (cm)"><input required inputMode="numeric" className={mid} value={d.waist} onChange={(e) => set('waist', e.target.value.replace(/[^\d.]/g, ''))} /></Field>
                <Field label="Hips (cm)"><input required inputMode="numeric" className={mid} value={d.hips} onChange={(e) => set('hips', e.target.value.replace(/[^\d.]/g, ''))} /></Field>
                <Field label="Shoes (EU)"><input required inputMode="decimal" className={mid} value={d.shoes} onChange={(e) => set('shoes', e.target.value.replace(/[^\d.]/g, ''))} /></Field>
                <Field label="Hair colour" className="col-span-1 sm:col-span-2"><input required className={mid} placeholder="Brown" value={d.hair} onChange={(e) => set('hair', e.target.value)} /></Field>
                <Field label="Eye colour" className="col-span-1 sm:col-span-2"><input required className={mid} placeholder="Green" value={d.eyes} onChange={(e) => set('eyes', e.target.value)} /></Field>
              </div>
              {nav('Continue →', !d.height)}
            </form>
          )}

          {step === 'digitals' && (
            <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); next() }}>
              <p className="max-w-[520px] text-[16px] leading-snug">Three photos taken today. Daylight, no make-up, hair back, fitted clothes, plain wall. Phone photos are perfect.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SLOTS.map((s) => {
                  const p = photos[s.pose]
                  return (
                    <label
                      key={s.pose}
                      className="group flex cursor-pointer flex-col gap-2"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        addPhoto(s.pose, e.dataTransfer.files[0])
                      }}
                    >
                      <span className={`relative block aspect-[3/4] overflow-hidden ${p ? 'bg-line' : 'border-2 border-dashed border-fg/70 group-hover:border-fg'}`}>
                        {p ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.url} alt={s.label} className="absolute inset-0 size-full object-cover" />
                            <span className="absolute bottom-2 right-2 bg-bg px-1.5 py-0.5 text-[11px] font-bold uppercase" style={narrow}>Replace</span>
                          </>
                        ) : (
                          <>
                            <Silhouette pose={s.pose} className="absolute inset-[12%] text-muted/60" />
                            <span className="absolute bottom-2 left-2 text-[12px] font-bold uppercase" style={narrow}>+ Add</span>
                          </>
                        )}
                      </span>
                      <span className="flex flex-col">
                        <span className="text-[12px] font-bold uppercase" style={narrow}>{s.label}{s.optional ? ' (optional)' : ''}</span>
                        <span className="text-[12px] text-muted">{s.hint}</span>
                      </span>
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => addPhoto(s.pose, e.target.files?.[0])} />
                    </label>
                  )
                })}
              </div>
              {photoError && <p className="text-[14px] text-red-600">{photoError}</p>}
              {nav(
                'Continue →',
                SLOTS.some((s) => !s.optional && !photos[s.pose]),
                `${SLOTS.filter((s) => !s.optional && photos[s.pose]).length} of 3 added`,
              )}
            </form>
          )}

          {step === 'send' && (
            <form className="grid grid-cols-1 gap-x-7 gap-y-7 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit() }}>
              <Field label="Instagram"><input className={big} placeholder="@handle" value={d.instagram} onChange={(e) => set('instagram', e.target.value)} /></Field>
              <Field label="TikTok"><input className={big} placeholder="@handle" value={d.tiktok} onChange={(e) => set('tiktok', e.target.value)} /></Field>
              <Field label="Anything we should know? (optional)" className="sm:col-span-2">
                <textarea rows={3} className={`${mid} resize-none`} placeholder="Experience, other agencies, when you’re free…" value={d.experience} onChange={(e) => set('experience', e.target.value)} />
              </Field>
              <label className="flex sm:col-span-2 items-start gap-3 text-[14px] leading-snug">
                <input required type="checkbox" checked={d.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-current" />
                <span>
                  I agree that {brand} may keep my details and photos to review my application and contact me, as described in the{' '}
                  <Link href={sitePath(site, '/privacy')} className="underline">privacy policy</Link>.
                  {scoutingEmail && <> Upload trouble or questions: <a href={`mailto:${scoutingEmail}`} className="underline">{scoutingEmail}</a>.</>}
                </span>
              </label>
              {error && <p className="sm:col-span-2 text-[14px] text-red-600">{error}</p>}
              <div className="sm:col-span-2">{nav(sending ? 'Sending…' : 'Send application', sending)}</div>
            </form>
          )}
        </div>

        <aside aria-label="Your comp card" className="hidden self-start md:block">{card()}</aside>
      </div>

      {/* Progress: the INCH” ruler, one number per step (go back to any step already reached). */}
      <div className="pb-6">
        <Ruler
          count={4}
          pos={number - 1}
          active={[number - 1]}
          onSelect={(k) => {
            const n = ((k % 4) + 4) % 4 + 1
            if (n <= furthest) go(flow.find((s) => NUMBER[s] === n) ?? step)
          }}
          reduced={reduced}
          segW={48}
          fontPx={14}
          tickH={18}
          minors={9}
        />
      </div>
    </div>
  )
}
