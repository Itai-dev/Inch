'use client'

/**
 * Become a model: an opening screen, then four steps — 01 You (and a parent or guardian's
 * consent at 16 and under), 02 Measurements, 03 Digitals, 04 Send — with a comp card that fills in as
 * the form does, and the INCH” ruler as the progress bar. Photos are shrunk in the
 * browser before upload so a whole application fits in one request.
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Logo } from '@/components/brand/Logo'
import { TypeText } from '@/components/motion/TypeText'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { ageFrom, GUARDIAN_AGE } from '@/lib/apply-criteria'
import { shrinkPhoto } from '@/lib/shrink-photo'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { cmToFeet } from '@/lib/units'
import { UnitToggle } from '@/components/Measurements'
import { CompCard, type CardStat } from './CompCard'
import { hasSitePageBehind } from '@/components/RouteMemory'
import { StepRuler } from './StepRuler'
import { CardOpening, CardPost, type Place } from './CardMotion'
import { ColorSelect, EYES, HAIR } from './ColorSelect'
import { CountrySelect } from './CountrySelect'
import { HeightTape, Tape, type TapeScale } from './Tape'
import { Silhouette, type Pose } from './Silhouette'

type Data = {
  firstName: string
  lastName: string
  birthdate: string
  country: string
  email: string
  phone: string
  guardianName: string
  guardianPhone: string
  guardianConsent: boolean
  height: number | null
  tshirt: string
  pants: string
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
  firstName: '', lastName: '', birthdate: '', country: '', email: '', phone: '', guardianName: '', guardianPhone: '', guardianConsent: false,
  height: null, tshirt: '', pants: '', shoes: '', hair: '', eyes: '', instagram: '', tiktok: '', experience: '', consent: false,
}

const SLOTS: { pose: Pose; label: string; hint: string }[] = [
  { pose: 'portrait', label: 'Portrait', hint: 'Face, straight on' },
  { pose: 'medium', label: 'Medium', hint: 'Waist up' },
  { pose: 'full-body', label: 'Full body', hint: 'Head to toe' },
  { pose: 'profile', label: 'Profile', hint: 'Turn to the side' },
]

/** Step numbers on the ruler (the guardian step belongs to 01). */
const NUMBER: Partial<Record<Step, number>> = { you: 1, guardian: 1, measure: 2, digitals: 3, send: 4 }
const STEP_NAMES = ['You', 'Measurements', 'Digitals', 'Send']
const TITLE: Partial<Record<Step, string>> = { you: 'About you', guardian: 'A parent or guardian', measure: 'Measurements', digitals: 'Digitals', send: 'Last thing' }

const narrow = { fontStretch: '80%' } as const
const big =
  'w-full border-b-2 border-fg bg-transparent pb-1.5 text-[clamp(22px,2.1vw,30px)] font-semibold outline-none placeholder:text-muted/40 placeholder-shown:border-line focus:border-fg'
const mid = 'w-full border-b-2 border-fg bg-transparent pb-1.5 text-[clamp(20px,1.7vw,25px)] font-semibold outline-none placeholder:text-muted/40 placeholder-shown:border-line focus:border-fg'

function Field({ label, hint, className = '', children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <span className="text-[13px] uppercase tracking-[0.04em]" style={narrow}>{label}</span>
      {children}
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </label>
  )
}

type Unit = 'in' | 'cm'

/** Sizes: T-shirt as letters; pants and shoes in EU sizes on tapes, each resting on a typical size before it's touched. */
const TSHIRT = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
const PANTS: TapeScale = { min: 30, max: 60, px: 16, snap: 2, every: 4 }
const SHOES: TapeScale = { min: 34, max: 48, px: 32, snap: 0.5, every: 1 }
const SIZE_KEYS: Size[] = ['tshirt', 'pants', 'shoes']
type Size = 'tshirt' | 'pants' | 'shoes'
const START = { tshirt: { women: 'S', men: 'M' }, pants: { women: 36, men: 48 }, shoes: { women: 39, men: 43 } }
const SIZE_NAME: Record<Size, string> = { tshirt: 'T-shirt', pants: 'Pants', shoes: 'Shoes' }

const half = (v: string | number) => String(v).replace('.5', '½')

export function ApplyFunnel({ site, scoutingEmail }: { site: Site; image?: string; scoutingEmail?: string }) {
  const { brand, division } = SITES[site]
  const reduced = useReducedMotion()
  const [step, setStep] = useState<Step>('you')
  // The page opens on the card turning over and moving aside (opening), then the ruler and the
  // form write in (writing); sending drops the card through a slot (posting) before the thanks.
  const [phase, setPhase] = useState<'opening' | 'writing' | 'ready' | 'posting'>('opening')
  const asideRef = useRef<HTMLElement>(null)
  const stripRef = useRef<HTMLDetailsElement>(null)
  /** The card beside the form when it shows (desktop), else the strip it folds into. */
  const cardPlace = (): Place => {
    const a = asideRef.current
    if (a && a.offsetParent) return { el: a, card: true }
    return stripRef.current ? { el: stripRef.current, card: false } : null
  }
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])
  /** With reduced motion, no card moments: the page is simply there. */
  const shownPhase = reduced && phase !== 'posting' ? 'ready' : phase
  useEffect(() => {
    if (phase !== 'writing') return
    const id = setTimeout(() => setPhase('ready'), 1300)
    return () => clearTimeout(id)
  }, [phase])
  const [furthest, setFurthest] = useState(0)
  const [d, setD] = useState<Data>(initial)
  const [photos, setPhotos] = useState<Partial<Record<Pose, Photo>>>({})
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unit, setUnit] = useState<Unit>('cm')
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
  // A parent or guardian consents for applicants up to GUARDIAN_AGE (16).
  const isMinor = age >= 0 && age <= GUARDIAN_AGE
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
  const started = step !== 'done' && (Object.values(d).some(Boolean) || Object.keys(photos).length > 0)
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
  const back = () => (index > 0 ? go(flow[index - 1]) : close())

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
    // Sent: the card goes through the slot (CardPost), then the thanks.
    if (res?.ok) setPhase(reduced ? 'ready' : 'posting')
    if (res?.ok && reduced) go('done')
    else setError(`Something went wrong. Please try again${scoutingEmail ? `, or write to ${scoutingEmail}` : ''}.`)
  }

  // What the measurements step still needs.
  const gaps = (
    [['Height', d.height], ['T-shirt', d.tshirt], ['Pants', d.pants], ['Shoes', d.shoes], ['Hair', d.hair], ['Eyes', d.eyes]] as const
  ).filter(([, v]) => !v).map(([k]) => k)

  // The comp card, filled in as far as the form is.
  const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ')
  const stats: CardStat[] = [
    ['Age', Number.isFinite(age) && age > 0 ? age : undefined],
    ['Country', d.country],
    ['Height', d.height ? (unit === 'in' ? cmToFeet(d.height) : `${d.height} cm`) : undefined],
    ['T-shirt', d.tshirt],
    ['Pants', d.pants && `${d.pants} EU`],
    ['Shoes', d.shoes && `${half(d.shoes)} EU`],
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
  /** What to know before starting, at the top of the first step. */
  const BEFORE = 'No experience needed: we look at every application ourselves. You’ll need four photos taken today; phone photos by a friend are perfect. Daylight, no make-up, hair back, fitted clothes. About 3 minutes.'
  // The thanks, in the middle of the screen once the card has gone through the slot.
  if (step === 'done')
    body = (
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-start justify-center gap-6 px-gutter py-16 md:min-h-[calc(100dvh-120px)]">
        <p className="label text-muted"><TypeText text="Application received" at={100} ms={20} /></p>
        <h1 className="wordmark text-[clamp(48px,6vw,84px)] uppercase leading-[0.95]">
          <TypeText text={`Thank you${d.firstName ? `, ${d.firstName}` : ''}.`} at={500} ms={45} />
        </h1>
        <p className="text-[17px] leading-snug">
          <TypeText text="We’ve received your application. Our scouts look at every one, and we’ll get back to you by email or phone." at={1100} ms={10} />
        </p>
        {scoutingEmail && <p className="text-[14px] text-muted">Questions? Write to <a href={`mailto:${scoutingEmail}`} className="underline">{scoutingEmail}</a>.</p>}
        <button type="button" onClick={close} className="scale-in self-start text-[14px] font-bold uppercase underline" style={{ ...narrow, '--at': '2300ms' } as React.CSSProperties}>Back to {brand}</button>
      </div>
    )

  const nav = (submitLabel = 'Continue →', disabled = false, note?: string) => (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3">
      <button type="submit" disabled={disabled} className="h-12 bg-fg px-7 text-[14px] font-bold uppercase tracking-[0.04em] text-bg hover:opacity-85 disabled:opacity-40" style={narrow}>
        {submitLabel}
      </button>
      <button type="button" onClick={back} className="text-[14px] font-bold uppercase text-muted hover:text-fg" style={narrow}>
        Back
      </button>
      {note && <span className="text-[13px] text-muted">{note}</span>}
    </div>
  )

  if (!body) body = (
    <div data-apply-phase={shownPhase} className="mx-auto flex w-full max-w-[1360px] flex-col gap-8 px-gutter pb-12 pt-4 md:min-h-[calc(100dvh-80px)] md:pt-6">
      {trap}
      {shownPhase === 'opening' && <CardOpening front={card()} division={division} target={cardPlace} onDone={() => setPhase('writing')} />}
      {phase === 'posting' && (
        <CardPost
          front={card()}
          division={division}
          from={cardPlace}
          onDone={() => {
            setPhase('ready')
            go('done')
          }}
        />
      )}
      {/* Progress on top, over the form and the card; the step names are the only titles. */}
      {/* A small ruler: the form and the card are the page. */}
      <div className="apply-ruler apply-in mx-auto w-full max-w-[620px]">
        <StepRuler
          steps={STEP_NAMES}
          current={number - 1}
          reached={furthest - 1}
          onSelect={(i) => go(flow.find((s) => NUMBER[s] === i + 1) ?? step)}
        />
      </div>
      <h1 className="sr-only">{TITLE[step]}</h1>

      {/* Phones: the comp card folds into a strip above the form. */}
      <details ref={stripRef} className="apply-in apply-strip paper border border-[#d3d0c9] text-[#0a0a0a] md:hidden">
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
              {[Number.isFinite(age) && age > 0 ? age : null, d.country, d.height ? (unit === 'in' ? cmToFeet(d.height) : `${d.height} cm`) : null].filter(Boolean).join(' · ') || 'Fills in as you go'}
            </span>
          </span>
          <span className="ml-auto text-[11px] font-bold uppercase" style={narrow}>Card</span>
        </summary>
        <div className="px-3.5 pb-3.5">{card('p-0! bg-transparent! border-0!', true)}</div>
      </details>

      {/* The form and the card, centred in the space under the ruler. */}
      <div className="grid gap-12 md:flex-1 md:grid-cols-[minmax(0,680px)_minmax(0,480px)] md:content-center md:items-start md:justify-center md:gap-x-[clamp(72px,9vw,160px)] md:py-10">
        <div className="apply-form apply-in flex flex-col gap-12">
          {step === 'you' && (
            <form className="grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); next() }}>
              <p className="text-[15px] leading-snug text-muted sm:col-span-2">{BEFORE}</p>
              <Field label="First name"><input required autoComplete="given-name" className={big} value={d.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
              <Field label="Last name"><input required autoComplete="family-name" className={big} value={d.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
              <Field label="Date of birth" hint={Number.isFinite(age) && age > 0 ? `${age} years old` : undefined}>
                <input required type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} className={big} value={d.birthdate} onChange={(e) => set('birthdate', e.target.value)} />
              </Field>
              <CountrySelect label="Country" value={d.country} onChange={(v) => set('country', v)} inputClassName={big} />
              <Field label="Email"><input required type="email" autoComplete="email" placeholder="you@email.com" className={big} value={d.email} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Phone"><input required type="tel" autoComplete="tel" placeholder="+972" className={big} value={d.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              <p className="sm:col-span-2 text-[13px] text-muted">{GUARDIAN_AGE} or younger? We’ll ask for a parent or guardian’s consent next.</p>
              <div className="sm:col-span-2">{nav('Continue →', false, 'Takes about 3 minutes')}</div>
            </form>
          )}

          {step === 'guardian' && (
            <form className="grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); next() }}>
              <p className="sm:col-span-2 text-[16px] leading-snug">You’re {GUARDIAN_AGE} or younger, so a parent or guardian needs to agree to your application. We’ll speak to them first.</p>
              <Field label="Their name"><input required className={big} value={d.guardianName} onChange={(e) => set('guardianName', e.target.value)} /></Field>
              <Field label="Their phone"><input required type="tel" className={big} value={d.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} /></Field>
              <label className="flex sm:col-span-2 items-start gap-3 text-[14px] leading-snug">
                <input required type="checkbox" checked={d.guardianConsent} onChange={(e) => set('guardianConsent', e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-current" />
                <span>I’m {d.firstName ? `${d.firstName}’s` : 'their'} parent or guardian, and I consent to this application to {brand}.</span>
              </label>
              <div className="sm:col-span-2">{nav()}</div>
            </form>
          )}

          {step === 'measure' && (
            <form
              className="flex flex-col gap-10"
              onSubmit={(e) => {
                e.preventDefault()
                if (gaps.length) setTried(true)
                else next()
              }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[12px] uppercase tracking-[0.04em]" style={narrow}>Height</span>
                  {/* Centimetres or feet and inches. */}
                  <UnitToggle unit={unit} onChange={setUnit} className="text-[15px]" />
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className={`wordmark text-[clamp(52px,5.5vw,76px)] tabular-nums ${d.height ? '' : 'text-muted/40'}`}>
                    {unit === 'in' ? cmToFeet(d.height ?? 175) : (d.height ?? 175)}
                  </span>
                  {unit === 'cm' && <span className="text-[18px] font-bold">cm</span>}
                  {d.height && <span className="ml-2 text-[14px] text-muted">{unit === 'in' ? `${d.height} cm` : cmToFeet(d.height)}</span>}
                </div>
                <HeightTape value={d.height} unit={unit} onChange={(cm) => set('height', cm)} />
                <span className="text-[12px] text-muted">{d.height ? 'Drag the tape, or use the arrow keys.' : 'Drag the tape to your height.'}</span>
              </div>
              {/* Each size is a closed field; tap one and its letters or its tape open below, full width. */}
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-x-6 gap-y-10 sm:gap-x-10">
                  {SIZE_KEYS.map((k) => {
                    const value = d[k]
                    const open = openSize === k
                    return (
                      <div key={k} className="flex min-w-0 flex-col gap-1.5">
                        <span className="truncate text-[12px] uppercase tracking-[0.04em]" style={narrow}>
                          {SIZE_NAME[k]} {k !== 'tshirt' && <span className="text-muted">EU</span>}
                        </span>
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={`${SIZE_NAME[k]}, ${value ? half(value) : 'not set'}`}
                          onClick={() => {
                            if (open) return setOpenSize(null)
                            if (!value && k !== 'tshirt') set(k, String(START[k][division]))
                            setOpenSize(k)
                          }}
                          className={`flex w-full items-center gap-2 border-b-2 pb-1.5 text-left text-[clamp(20px,1.7vw,25px)] font-semibold tabular-nums outline-none ${value ? 'border-fg' : 'border-line focus-visible:border-fg'}`}
                        >
                          <span className={`min-w-0 flex-1 truncate ${value ? '' : 'text-muted/40'}`}>{half(value || START[k][division])}</span>
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
                      <span className="text-[12px] uppercase tracking-[0.04em]" style={narrow}>
                        {SIZE_NAME[openSize]} {openSize !== 'tshirt' && <span className="text-muted">EU</span>}
                      </span>
                      <button type="button" onClick={() => setOpenSize(null)} className="text-[12px] font-bold uppercase underline" style={narrow}>
                        Done
                      </button>
                    </div>
                    {openSize === 'tshirt' ? (
                      <div role="radiogroup" aria-label="T-shirt size" className="flex flex-wrap gap-2 pt-2">
                        {TSHIRT.map((x) => (
                          <button
                            key={x}
                            type="button"
                            role="radio"
                            aria-checked={d.tshirt === x}
                            onClick={() => {
                              set('tshirt', x)
                              setOpenSize(null)
                            }}
                            className={`h-11 min-w-14 border-2 px-3 text-[15px] font-bold uppercase ${d.tshirt === x ? 'border-fg bg-fg text-bg' : 'border-line hover:border-fg'}`}
                            style={narrow}
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Tape
                        key={openSize}
                        label={SIZE_NAME[openSize]}
                        value={d[openSize] ? Number(d[openSize]) : null}
                        start={START[openSize][division]}
                        scale={openSize === 'shoes' ? SHOES : PANTS}
                        onChange={(x) => set(openSize, String(x))}
                        valueText={(x) => `${half(x)} EU`}
                        onDone={() => setOpenSize(null)}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2">
                <ColorSelect label="Hair colour" options={HAIR} value={d.hair} onChange={(v) => set('hair', v)} inputClassName={mid} />
                <ColorSelect label="Eye colour" options={EYES} value={d.eyes} onChange={(v) => set('eyes', v)} iris inputClassName={mid} />
              </div>
              {nav('Continue →', false, tried && gaps.length ? `Still to set: ${gaps.join(', ')}` : 'Tap a size to set it.')}
            </form>
          )}

          {step === 'digitals' && (
            <form className="flex flex-col gap-9" onSubmit={(e) => { e.preventDefault(); next() }}>
              <p className="max-w-[520px] text-[16px] leading-snug">Four photos taken today. Daylight, no make-up, hair back, fitted clothes, plain wall. Phone photos are perfect.</p>
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
                        <span className="text-[12px] font-bold uppercase" style={narrow}>{s.label}</span>
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
                SLOTS.some((s) => !photos[s.pose]),
                `${SLOTS.filter((s) => photos[s.pose]).length} of ${SLOTS.length} added`,
              )}
            </form>
          )}

          {step === 'send' && (
            <form className="grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit() }}>
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

        <aside ref={asideRef} aria-label="Your comp card" className="apply-card hidden self-start md:block">{card()}</aside>
      </div>
    </div>
  )

  return (
    <div ref={sheetRef} data-sheet role="dialog" aria-modal="true" aria-label="Become a model" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg text-fg">
      {/* Top bar, as on the model page: the logo, and close. */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-bg px-gutter pb-3 pt-[clamp(16px,2vw,28px)]">
        <Logo division={division} className="text-[48px] md:text-[70px]" />
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
