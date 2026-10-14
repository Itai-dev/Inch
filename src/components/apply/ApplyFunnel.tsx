'use client'

/**
 * Become a model: an opening screen, then four steps — 01 You (and a guardian for
 * under-18s), 02 Measurements, 03 Digitals, 04 Send — with a comp card that fills in as
 * the form does, and the INCH” ruler as the progress bar. Photos are shrunk in the
 * browser before upload so a whole application fits in one request.
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NameOpen } from '@/components/motion/NameOpen'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { ageFrom, GUARDIAN_AGE } from '@/lib/apply-criteria'
import { shrinkPhoto } from '@/lib/shrink-photo'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { cmToFeet, cmToInches } from '@/lib/units'
import { CompCard, type CardStat } from './CompCard'
import { hasSitePageBehind } from '@/components/RouteMemory'
import { StepRuler } from './StepRuler'
import { ColorSelect, EYES, HAIR } from './ColorSelect'
import { HeightTape, Tape, type TapeScale } from './Tape'
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
const STEP_NAMES = ['You', 'Measurements', 'Digitals', 'Send']
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

type Unit = 'in' | 'cm'

/** The sizes on tapes, in cm and in inches (half-inch ticks), with where each tape rests before it's touched (cm). */
const CM = (min: number, max: number): TapeScale => ({ min, max, px: 12.8, snap: 1, every: 5 })
const IN = (min: number, max: number): TapeScale => ({ min, max, px: 25.6, snap: 0.5, every: 2 })
const SIZES = {
  bust: { cm: CM(60, 140), in: IN(24, 55), start: { women: 84, men: 96 } },
  waist: { cm: CM(45, 120), in: IN(18, 47), start: { women: 62, men: 78 } },
  hips: { cm: CM(60, 140), in: IN(24, 55), start: { women: 90, men: 94 } },
} as const
const SIZE_KEYS: Size[] = ['bust', 'waist', 'hips', 'shoes']
const SHOES: TapeScale = { min: 34, max: 48, px: 32, snap: 0.5, every: 1 }
type Size = keyof typeof SIZES | 'shoes'

// Sizes are kept in cm; inches are shown to the nearest half, written 32½.
const toShown = (cm: string | number, unit: Unit) => (unit === 'cm' ? String(cm) : String(Math.round((Number(cm) / 2.54) * 2) / 2))
const fromShown = (v: string, unit: Unit) => (unit === 'cm' ? v : String(Math.round(Number(v) * 2.54)))
const half = (v: string | number) => String(v).replace('.5', '½')

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
  const [unit, setUnit] = useState<Unit>('in')
  const [openSize, setOpenSize] = useState<Size | null>(null)
  const tapeRef = useRef<HTMLDivElement>(null)
  // The open tape takes the keyboard, so the arrow keys move it straight away.
  useEffect(() => {
    if (openSize) (tapeRef.current?.querySelector('[role=slider]') as HTMLElement | null)?.focus({ preventScroll: true })
  }, [openSize])
  /** Continue was pressed with something still unset: say what. */
  const [tried, setTried] = useState(false)
  const startedAt = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const set = <K extends keyof Data>(k: K, v: Data[K]) => setD((p) => ({ ...p, [k]: v }))

  const age = d.birthdate ? ageFrom(d.birthdate) : NaN
  const isMinor = age >= 0 && age < GUARDIAN_AGE
  const flow: Step[] = useMemo(() => ['you', ...(isMinor ? (['guardian'] as Step[]) : []), 'measure', 'digitals', 'send'], [isMinor])
  const index = flow.indexOf(step)
  const number = NUMBER[step] ?? 0

  const go = (s: Step) => {
    setTried(false)
    setStep(s)
    setFurthest((f) => Math.max(f, NUMBER[s] ?? 0))
    sheetRef.current?.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }
  const next = () => go(flow[index + 1])
  const started = step !== 'intro' && step !== 'done'
  const close = useCallback(() => {
    if (started && !window.confirm('Leave your application? What you’ve filled in will be lost.')) return
    if (hasSitePageBehind()) router.back()
    else router.push(sitePath(site))
  }, [started, router, site])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])
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

  // Sizes in the unit shown (shoes are always EU); kept in cm.
  const sizeName = (k: Size) => (k === 'bust' ? (division === 'men' ? 'Chest' : 'Bust') : k === 'waist' ? 'Waist' : k === 'hips' ? 'Hips' : 'Shoes')
  const sizeShown = (k: Size) =>
    k === 'shoes'
      ? { value: d.shoes ? Number(d.shoes) : null, start: division === 'men' ? 43 : 39 }
      : { value: d[k] ? Number(toShown(d[k], unit)) : null, start: Number(toShown(SIZES[k].start[division], unit)) }
  const setSize = (k: Size, x: number) => set(k, k === 'shoes' ? String(x) : fromShown(String(x), unit))

  // What the measurements step still needs.
  const gaps = (
    [['Height', d.height], [division === 'men' ? 'Chest' : 'Bust', d.bust], ['Waist', d.waist], ['Hips', d.hips], ['Shoes', d.shoes], ['Hair', d.hair], ['Eyes', d.eyes]] as const
  ).filter(([, v]) => !v).map(([k]) => k)

  // The comp card, filled in as far as the form is.
  const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ')
  const inUnit = (cm: string) => (cm && unit === 'in' ? cmToInches(Number(cm)) : cm)
  const stats: CardStat[] = [
    ['Age', Number.isFinite(age) && age > 0 ? age : undefined],
    ['City', d.city],
    ['Height', d.height ? (unit === 'in' ? cmToFeet(d.height) : `${d.height} cm`) : undefined],
    [division === 'men' ? 'Chest' : 'Bust', inUnit(d.bust)],
    ['Waist', inUnit(d.waist)],
    ['Hips', inUnit(d.hips)],
    ['Shoes', d.shoes],
    ['Hair', d.hair],
    ['Eyes', d.eyes],
  ]
  const card = (className = '', flat = false) => (
    <CompCard
      flat={flat}
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

  let body: React.ReactNode = null
  if (step === 'intro')
    body = (
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-gutter py-8 md:min-h-[calc(100dvh-84px)] md:content-center md:gap-[clamp(48px,6vw,120px)] md:py-12 md:grid-cols-[minmax(0,480px)_minmax(0,560px)] md:items-center md:justify-center">
        {image && (
          <div className="relative aspect-[3/4] max-h-[42dvh] w-full overflow-hidden bg-line md:max-h-[72dvh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="absolute inset-0 size-full object-cover object-[50%_15%]" />
          </div>
        )}
        <div className={`flex max-w-[560px] flex-col gap-7 ${image ? '' : 'md:col-span-2'}`}>
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
    body = (
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-gutter py-8 md:min-h-[calc(100dvh-84px)] md:content-center md:gap-[clamp(48px,6vw,120px)] md:py-12 md:grid-cols-[minmax(0,560px)_minmax(0,480px)] md:items-center md:justify-center">
        <div className="flex flex-col gap-6">
          <p className="label text-muted">Application sent</p>
          <h1 className="wordmark text-[clamp(48px,6vw,84px)] uppercase">Thank you{d.firstName ? `, ${d.firstName}` : ''}.</h1>
          <p className="text-[17px] leading-snug">Our scouts look at every application. If there’s a fit, we’ll contact you by email or phone.</p>
          {scoutingEmail && <p className="text-[14px] text-muted">Questions? Write to <a href={`mailto:${scoutingEmail}`} className="underline">{scoutingEmail}</a>.</p>}
          <button type="button" onClick={close} className="self-start text-[14px] font-bold uppercase underline" style={narrow}>Back to {brand}</button>
        </div>
        {card()}
      </div>
    )

  const heading = (
    <div className="flex flex-col gap-3">
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

  if (!body) body = (
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
            <span className="wordmark truncate text-[18px] uppercase">{fullName || 'Your comp card'}</span>
            <span className="truncate text-[11px] uppercase text-muted">
              {[Number.isFinite(age) && age > 0 ? age : null, d.city, d.height ? (unit === 'in' ? cmToFeet(d.height) : `${d.height} cm`) : null].filter(Boolean).join(' · ') || 'Fills in as you go'}
            </span>
          </span>
          <span className="ml-auto text-[11px] font-bold uppercase" style={narrow}>Card</span>
        </summary>
        <div className="px-3.5 pb-3.5">{card('p-0! bg-transparent!', true)}</div>
      </details>

      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-gutter py-8 md:min-h-[calc(100dvh-84px)] md:content-center md:gap-[clamp(48px,6vw,120px)] md:py-12 md:grid-cols-[minmax(0,640px)_minmax(0,480px)] md:items-start md:justify-center">
        <div className="flex flex-col gap-8">
          <StepRuler
            steps={STEP_NAMES}
            current={number - 1}
            reached={furthest - 1}
            onSelect={(i) => go(flow.find((s) => NUMBER[s] === i + 1) ?? step)}
          />
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
            <form
              className="flex flex-col gap-8"
              onSubmit={(e) => {
                e.preventDefault()
                if (gaps.length) setTried(true)
                else next()
              }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[12px] font-bold uppercase tracking-[0.04em]" style={narrow}>Height</span>
                  {/* Inches or centimetres, for every size on this step. */}
                  <div role="group" aria-label="Units" className="flex border-2 border-fg text-[12px] font-bold uppercase" style={narrow}>
                    {(['in', 'cm'] as Unit[]).map((u) => (
                      <button
                        key={u}
                        type="button"
                        aria-pressed={unit === u}
                        onClick={() => setUnit(u)}
                        className={`min-w-11 px-3 py-1.5 ${unit === u ? 'bg-fg text-bg' : 'hover:bg-surface'}`}
                      >
                        {u === 'in' ? 'Inches' : 'cm'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className={`wordmark text-[clamp(64px,7vw,96px)] tabular-nums ${d.height ? '' : 'text-muted/40'}`}>
                    {unit === 'in' ? cmToFeet(d.height ?? 175) : (d.height ?? 175)}
                  </span>
                  {unit === 'cm' && <span className="text-[22px] font-bold">cm</span>}
                  {d.height && <span className="ml-2 text-[14px] text-muted">{unit === 'in' ? `${d.height} cm` : cmToFeet(d.height)}</span>}
                </div>
                <HeightTape value={d.height} unit={unit} onChange={(cm) => set('height', cm)} />
                <span className="text-[12px] text-muted">{d.height ? 'Drag the tape, or use the arrow keys.' : 'Drag the tape to your height.'}</span>
              </div>
              {/* Each size is a closed field; tap one and its tape opens below, full width. */}
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
                  {SIZE_KEYS.map((k) => {
                    const shown = sizeShown(k)
                    const open = openSize === k
                    return (
                      <div key={k} className="flex min-w-0 flex-col gap-1.5">
                        <span className="truncate text-[12px] font-bold uppercase tracking-[0.04em]" style={narrow}>
                          {sizeName(k)} <span className="text-muted">{k === 'shoes' ? 'EU' : unit}</span>
                        </span>
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={`${sizeName(k)}, ${shown.value ? half(shown.value) : 'not set'}`}
                          onClick={() => {
                            if (open) return setOpenSize(null)
                            if (!shown.value) setSize(k, shown.start)
                            setOpenSize(k)
                          }}
                          className={`flex w-full items-center gap-2 border-b-2 pb-1.5 text-left text-[clamp(20px,1.8vw,26px)] font-semibold tabular-nums outline-none ${shown.value ? 'border-fg' : 'border-line focus-visible:border-fg'}`}
                        >
                          <span className={`min-w-0 flex-1 truncate ${shown.value ? '' : 'text-muted/40'}`}>{half(shown.value ?? shown.start)}</span>
                          <svg viewBox="0 0 12 8" aria-hidden className={`w-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
                            <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
                {openSize && (
                  <div ref={tapeRef} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[12px] font-bold uppercase tracking-[0.04em]" style={narrow}>
                        {sizeName(openSize)} <span className="text-muted">{openSize === 'shoes' ? 'EU' : unit}</span>
                      </span>
                      <button type="button" onClick={() => setOpenSize(null)} className="text-[12px] font-bold uppercase underline" style={narrow}>
                        Done
                      </button>
                    </div>
                    <Tape
                      key={`${openSize}-${unit}`}
                      label={sizeName(openSize)}
                      value={sizeShown(openSize).value}
                      start={sizeShown(openSize).start}
                      scale={openSize === 'shoes' ? SHOES : SIZES[openSize][unit]}
                      onChange={(x) => setSize(openSize, x)}
                      valueText={(x) => `${half(x)} ${openSize === 'shoes' ? 'EU' : unit}`}
                      onDone={() => setOpenSize(null)}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-x-7 gap-y-7 sm:grid-cols-2">
                <ColorSelect label="Hair colour" options={HAIR} value={d.hair} onChange={(v) => set('hair', v)} inputClassName={mid} />
                <ColorSelect label="Eye colour" options={EYES} value={d.eyes} onChange={(v) => set('eyes', v)} iris inputClassName={mid} />
              </div>
              {nav('Continue →', false, tried && gaps.length ? `Still to set: ${gaps.join(', ')}` : 'Tap a size to open its tape.')}
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

    </div>
  )

  return (
    <div ref={sheetRef} data-sheet role="dialog" aria-modal="true" aria-label="Become a model" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg text-fg">
      {/* Top bar, as on the model page: what this is, and close. */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-bg px-gutter pb-3 pt-[clamp(16px,2vw,28px)]">
        <p className="label text-muted">Become a model · {brand} {label}</p>
        <button type="button" onClick={close} aria-label="Close" className="-m-2 p-2 hover:opacity-60">
          <svg viewBox="0 0 24 24" className="size-6 md:size-[26px]" aria-hidden>
            <path d="M3 3l18 18M21 3L3 21" stroke="currentColor" strokeWidth="3" />
          </svg>
        </button>
      </div>
      {body}
    </div>
  )
}
