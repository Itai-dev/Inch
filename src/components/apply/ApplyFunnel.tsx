'use client'

/**
 * Become a model: an opening screen, then four steps — 01 You (and a parent or guardian's
 * consent at 16 and under), 02 Measurements, 03 Digitals, 04 Send — with a comp card that fills in as
 * the form does, and the INCH” ruler as the progress bar. Photos are shrunk in the
 * browser before upload so a whole application fits in one request.
 */
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import { PaperFold } from './PaperFold'
import { ColorSelect, EYES, HAIR } from './ColorSelect'
import { CountrySelect } from './CountrySelect'
import { HeightTape } from './Tape'
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
/** A handle field: the @ set in front, the underline under both (dark once filled or focused). */
const handleRow =
  'flex items-baseline border-b-2 border-line pb-1.5 text-[clamp(22px,2.1vw,30px)] font-semibold focus-within:border-fg has-[input:not(:placeholder-shown)]:border-fg'
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

/** The page's padding under the form and the card (pb-12), kept clear when the card is fitted to the screen. */
const BODY_PB = 48
/** The form keeps at least this much width beside the card. */
const FORM_MIN_W = 480
/** At least this much air above and below the form and the card. */
const MIN_AIR = 24
/** The comp card's own width beside the form (scaled down from this when the screen is short or narrow). */
const CARD_W = 820
/** The first step's fields, by name, to bring the first one missing into view. */
const YOU_FIELDS: Record<string, string> = {
  'First name': 'input[autocomplete=given-name]',
  'Last name': 'input[autocomplete=family-name]',
  'Date of birth': 'input[type=date]',
  Country: 'select[data-country]',
  Email: 'input[type=email]',
  Phone: 'input[type=tel]',
}
/** All four photos together must stay well under the ~4.5 MB a request to the site can carry. */
const PHOTOS_BUDGET = 3.6 * 1024 * 1024

/** Sizes: T-shirt as letters; pants and shoes in EU sizes on tapes, each resting on a typical size before it's touched. */
const TSHIRT = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
/** Each size's choices, as the pickers list them (pants and shoes in EU sizes). */
const range = (from: number, to: number, step: number) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => String(from + i * step))
const SIZE_OPTIONS: Record<'tshirt' | 'pants' | 'shoes', string[]> = { tshirt: TSHIRT, pants: range(30, 60, 2), shoes: range(34, 48, 0.5) }
const SIZE_KEYS: Size[] = ['tshirt', 'pants', 'shoes']
type Size = 'tshirt' | 'pants' | 'shoes'
const START = { tshirt: { women: 'S', men: 'M' }, pants: { women: 36, men: 48 }, shoes: { women: 39, men: 43 } }
const SIZE_NAME: Record<Size, string> = { tshirt: 'T-shirt', pants: 'Pants', shoes: 'Shoes' }

/** A small (i) that opens a note under it; a tap anywhere else closes it. */
function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])
  return (
    <span ref={root} className="relative block">
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={`flex size-[18px] items-center justify-center rounded-full border text-[11px] font-bold italic leading-none transition-colors ${open ? 'border-fg bg-fg text-bg' : 'border-muted text-muted hover:border-fg hover:text-fg'}`}
        style={{ fontFamily: 'Georgia, serif' }}
      >
        i
      </button>
      {open && (
        <span role="note" className="absolute right-0 top-full mt-2 block w-[min(300px,calc(100vw-48px))] border border-line bg-bg p-4 text-[14px] leading-snug text-muted shadow-[0_14px_34px_-14px_rgb(0_0_0/0.3)]">
          {children}
        </span>
      )}
    </span>
  )
}

/** A handle without its @ (or the profile link round it). */
const handleOf = (v: string) => v.trim().replace(/^https?:\/\/(www\.)?(instagram\.com|tiktok\.com)\/@?/i, '').replace(/^@+/, '').replace(/[/?#].*$/, '')
const half = (v: string | number) => String(v).replace('.5', '½')

export function ApplyFunnel({ site, scoutingEmail }: { site: Site; image?: string; scoutingEmail?: string }) {
  const { brand, division } = SITES[site]
  const reduced = useReducedMotion()
  const [step, setStep] = useState<Step>('you')
  // The page opens on the card turning over and moving aside (opening), then the ruler and the
  // form write in (writing); sending drops the card through a slot (posting) before the thanks.
  const [phase, setPhase] = useState<'opening' | 'writing' | 'ready' | 'posting'>('opening')
  const asideRef = useRef<HTMLElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  /** Phones: the comp card unfolded under its strip. */
  const [stripOpen, setStripOpen] = useState(false)
  /** The card beside the form when it shows (desktop), else the strip it folds into. */
  const cardPlace = (): Place => {
    // The card itself, inside the aside's room for its tilt (scaled with its box to fit the screen).
    const a = asideRef.current?.querySelector<HTMLElement>('[data-card]')
    if (a && a.offsetParent) return { el: a, card: true, zoom: cardScale.current }
    return stripRef.current ? { el: stripRef.current, card: false } : null
  }
  // Beside the form, the card is its own layer, fixed on the screen: whatever the form does (a
  // size's tape opening, a step growing or scrolling) the card stays exactly where it is. Its
  // column in the grid only keeps the room. It is scaled down (never up) so that it is always
  // whole on the screen, under the top bar and the ruler, however short or narrow the window; and
  // the form and the card are centred together in the room under the ruler (measured as each step
  // opens, so nothing moves while it is filled in).
  const rulerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const scaleBoxRef = useRef<HTMLDivElement>(null)
  const cardScale = useRef(1)
  useLayoutEffect(() => {
    const sheet = sheetRef.current
    const aside = asideRef.current
    const grid = gridRef.current
    const ruler = rulerRef.current
    const layer = layerRef.current
    const box = scaleBoxRef.current
    const inner = box?.firstElementChild as HTMLElement | null | undefined
    const form = grid?.firstElementChild as HTMLElement | null | undefined
    if (!sheet || !aside || !grid || !ruler || !layer || !box || !inner || !form) return
    // The step's form as it opens (before any of its menus do).
    const formH = form.offsetHeight
    const fit = () => {
      if (!aside.offsetParent) {
        grid.style.paddingTop = ''
        return
      }
      const h = inner.offsetHeight // the card at its own width (transforms don't count)
      const gs = getComputedStyle(grid)
      const ls = getComputedStyle(layer)
      const padX = parseFloat(ls.paddingLeft) + parseFloat(ls.paddingRight)
      const padTop = parseFloat(ls.paddingTop)
      const padY = padTop + parseFloat(ls.paddingBottom)
      // The room under the ruler, on the screen with the page at the top.
      const top = ruler.getBoundingClientRect().bottom - sheet.getBoundingClientRect().top + sheet.scrollTop
      const room = sheet.clientHeight - top - BODY_PB
      // Also narrow enough to leave the form its width beside it.
      const width = grid.clientWidth - parseFloat(gs.paddingLeft) - parseFloat(gs.paddingRight) - FORM_MIN_W - parseFloat(gs.columnGap) - padX
      const s = Math.max(0.4, Math.min(1, (room - 2 * MIN_AIR - padY) / h, width / CARD_W))
      cardScale.current = s
      inner.style.transform = s < 1 ? `scale(${s})` : ''
      const w = Math.round(CARD_W * s)
      const cardH = Math.round(h * s)
      box.style.width = `${w}px`
      box.style.height = `${cardH}px`
      // The form and the card together, centred in that room (the taller of them sets it).
      const air = Math.max(MIN_AIR, (room - Math.max(cardH, formH)) / 2)
      grid.style.paddingTop = `${Math.round(air)}px`
      // The column keeps the card's room; the card itself is laid over it, fixed, level with the form.
      aside.style.width = `${w + padX}px`
      layer.style.top = `${Math.round(top + air - padTop)}px`
      layer.style.left = `${Math.round(aside.getBoundingClientRect().left)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(sheet)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [step])
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])
  /** With reduced motion, no card moments: the page is simply there. */
  const shownPhase = reduced && phase !== 'posting' ? 'ready' : phase
  useEffect(() => {
    if (phase !== 'writing') return
    const id = setTimeout(() => setPhase('ready'), 900)
    return () => clearTimeout(id)
  }, [phase])
  // No patience: a tap or a key anywhere while the card is opening or the form is writing in
  // shows everything at once (the card jumps to its place, the ruler and the fields are simply there).
  const skipCard = useRef<(() => void) | null>(null)
  const skipped = useRef(false)
  useEffect(() => {
    if (phase !== 'opening' && phase !== 'writing') return
    const hurry = () => {
      skipped.current = true
      skipCard.current?.()
      setPhase('ready')
    }
    window.addEventListener('pointerdown', hurry, { passive: true })
    window.addEventListener('keydown', hurry)
    return () => {
      window.removeEventListener('pointerdown', hurry)
      window.removeEventListener('keydown', hurry)
    }
  }, [phase])
  const [furthest, setFurthest] = useState(0)
  const [d, setD] = useState<Data>(initial)
  const [photos, setPhotos] = useState<Partial<Record<Pose, Photo>>>({})
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Sent through, but nothing delivers applications yet (email not set up). */
  const [unsent, setUnsent] = useState(false)
  const [unit, setUnit] = useState<Unit>('cm')
  /** Continue was pressed with something still unset: say what. */
  const [tried, setTried] = useState(false)
  const startedAt = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  // The top bar's height, so the step ruler can stick right under it (phones).
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const bar = barRef.current
    const sheet = sheetRef.current
    if (!bar || !sheet) return
    const ro = new ResizeObserver(() => sheet.style.setProperty('--bar', `${bar.offsetHeight}px`))
    ro.observe(bar)
    return () => ro.disconnect()
  }, [])
  // The page doesn't scroll when everything is in view (it only does when a step is taller than the screen).
  useEffect(() => {
    const sheet = sheetRef.current
    const body = sheet?.lastElementChild as HTMLElement | null | undefined
    if (!sheet || !body) return
    const lock = () => {
      sheet.style.setProperty('overflow-y', 'hidden')
      const fits = sheet.scrollHeight <= sheet.clientHeight + 1
      if (!fits) sheet.style.removeProperty('overflow-y')
      else sheet.scrollTo({ top: 0 })
    }
    lock()
    const ro = new ResizeObserver(lock)
    ro.observe(sheet)
    ro.observe(body)
    return () => ro.disconnect()
  }, [step])
  const router = useRouter()
  const set = <K extends keyof Data>(k: K, v: Data[K]) => setD((p) => ({ ...p, [k]: v }))

  const age = d.birthdate ? ageFrom(d.birthdate) : NaN
  // A date that makes no sense (a year typed short, say): the form says so before it is sent.
  const badDate = !!d.birthdate && !(age >= 10 && age <= 80)
  // A parent or guardian consents for applicants up to GUARDIAN_AGE (16).
  const isMinor = age >= 0 && age <= GUARDIAN_AGE
  const flow: Step[] = useMemo(() => ['you', ...(isMinor ? (['guardian'] as Step[]) : []), 'measure', 'digitals', 'send'], [isMinor])
  const index = flow.indexOf(step)
  const number = NUMBER[step] ?? 0

  const go = (s: Step) => {
    setTried(false)
    setStep(s)
    setFurthest((f) => Math.max(f, NUMBER[s] ?? 0))
  }
  // Each step opens at the top of the page (straight there, before it is drawn).
  useLayoutEffect(() => {
    sheetRef.current?.scrollTo({ top: 0 })
  }, [step])
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
    // The photos, shrunk again if together they would still be too much for one request.
    let blobs = SLOTS.map((s) => photos[s.pose]?.blob).filter((b): b is Blob => !!b)
    for (const pass of [{ maxSide: 1400, quality: 0.75 }, { maxSide: 1200, quality: 0.68 }]) {
      if (blobs.reduce((n, b) => n + b.size, 0) <= PHOTOS_BUDGET) break
      blobs = await Promise.all(blobs.map((b) => shrinkPhoto(b, pass).catch(() => b)))
    }
    SLOTS.forEach((s, i) => photos[s.pose] && fd.append('digitals', blobs[i], `${s.pose}.jpg`))
    const res = await fetch('/api/apply', { method: 'POST', body: fd }).catch(() => null)
    setSending(false)
    if (!res?.ok) {
      // Say what the site answered, so a failure can be followed up (the API's own reason, or the status).
      const why = res ? ((await res.json().catch(() => null))?.error ?? `error ${res.status}`) : 'no connection'
      setError(`Something went wrong (${why}). Please try again${scoutingEmail ? `, or write to ${scoutingEmail}` : ''}.`)
      return
    }
    setUnsent(!!(await res.json().catch(() => ({})))?.unsent)
    // Sent: the card goes through the slot (CardPost), then the thanks.
    if (reduced) {
      setPhase('ready')
      go('done')
    } else setPhase('posting')
  }

  // What the first step still needs (in the form's order).
  const youGaps = (
    [
      ['First name', !d.firstName.trim()],
      ['Last name', !d.lastName.trim()],
      ['Date of birth', !d.birthdate || badDate],
      ['Country', !d.country],
      ['Email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())],
      ['Phone', d.phone.replace(/\D/g, '').length < 6],
    ] as const
  ).filter(([, bad]) => bad).map(([k]) => k)
  const youNote = [
    youGaps.filter((k) => k !== 'Date of birth' || !d.birthdate).length && `Still to fill in: ${youGaps.filter((k) => !(k === 'Date of birth' && d.birthdate)).map((k) => (k)).join(', ')}.`,
    badDate && 'Check the date of birth (a four-digit year).',
  ].filter(Boolean).join(' ')

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
  const card = (className = '', flat = false, still = false) => (
    <CompCard
      flat={flat}
      still={still}
      brand={brand}
      division={division}
      name={fullName}
      stats={stats}
      photos={SLOTS.map((s) => ({ label: s.label, url: photos[s.pose]?.url }))}
      contact={[d.email || 'Email —', d.instagram ? `@${d.instagram}` : 'Instagram —']}
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

  /** The folded strip's row (phones): the four photos small, the name, a line of details. */
  const stripRow = (
    <>
      <span className="flex shrink-0 gap-0.5">
        {SLOTS.map((s) => (
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
    </>
  )
  /** The strip as the opening card turns into it (phones). */
  const compact = (
    <div className="paper border border-[#dcdad5] text-[#0a0a0a]">
      <div className="flex items-center gap-3 px-3.5 py-3">{stripRow}</div>
      <div className="px-3.5 pb-3.5">{card('p-0! bg-transparent! border-0!', true)}</div>
    </div>
  )

  let body: React.ReactNode = null
  /** What to know before starting, at the top of the first step. */
  const BEFORE = 'No experience needed: we look at every application ourselves. You’ll need four photos taken today; phone photos by a friend are perfect. Daylight, no make-up, hair back, fitted clothes. About 3 minutes.'
  // The thanks, in the middle of the screen once the card has gone through the slot.
  // The words follow the check, once it is written.
  const lag = CHECK_MS
  if (step === 'done')
    body = (
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-start justify-center gap-6 px-gutter py-16 md:min-h-[calc(100dvh-120px)]">
        <ReceivedCheck />
        <p className="label text-muted"><TypeText text="Application received" at={lag} ms={12} /></p>
        <h1 className="wordmark text-[clamp(48px,6vw,84px)] uppercase leading-[0.95]">
          <TypeText text={`Thank you${d.firstName ? `, ${d.firstName}` : ''}.`} at={lag + 220} ms={28} />
        </h1>
        <p className="text-[17px] leading-snug">
          <TypeText text="It’s with our scouts now. We look at every application ourselves; if there’s a fit, we’ll be in touch by email or phone to meet you." at={lag + 620} ms={5} />
        </p>
        {unsent && <p className="border-l-2 border-current pl-3 text-[13px] text-muted">Not delivered: this site isn’t connected to email yet (RESEND_API_KEY in Vercel), so nothing was sent.</p>}
        {scoutingEmail && <p className="text-[14px] text-muted">Questions? Write to <a href={`mailto:${scoutingEmail}`} className="underline">{scoutingEmail}</a>.</p>}
        <button type="button" onClick={close} className="ink-line scale-in self-start text-[14px] font-bold uppercase" style={{ ...narrow, '--at': `${lag + 1350}ms` } as React.CSSProperties}>Back to {brand}</button>
      </div>
    )

  const nav = (submitLabel = 'Continue →', disabled = false, note?: string, alert = false) => (
    <div className="apply-nav flex flex-wrap items-center gap-x-6 gap-y-3 pt-3">
      <button type="submit" disabled={disabled} className="h-12 bg-fg px-7 text-[14px] font-bold uppercase text-bg hover:opacity-85 disabled:opacity-40" style={narrow}>
        {submitLabel}
      </button>
      <button type="button" onClick={back} className="text-[14px] font-bold uppercase text-muted hover:text-fg" style={narrow}>
        Back
      </button>
      {note && (alert ? <span role="alert" className="text-[13px] font-bold">{note}</span> : <span className="text-[13px] text-muted">{note}</span>)}
    </div>
  )

  if (!body) body = (
    <div data-apply-phase={shownPhase} className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-gutter pb-12 pt-4 md:min-h-[calc(100dvh-var(--bar,80px))] md:pt-6">
      {trap}
      {shownPhase === 'opening' && <CardOpening front={card()} compact={compact} division={division} target={cardPlace} skipRef={skipCard} onDone={() => setPhase(skipped.current ? 'ready' : 'writing')} />}
      {phase === 'posting' && (
        <CardPost
          front={card('', false, true)}
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
      {/* Phones and tablets: it stays in view under the top bar while the form scrolls, not cut off by it. */}
      <div ref={rulerRef} className="apply-ruler apply-in mx-auto w-full max-w-[720px] shrink-0 overflow-hidden pb-1 max-lg:sticky max-lg:top-[var(--bar,72px)] max-lg:z-[9] max-lg:-mt-2 max-lg:bg-bg max-lg:pb-3 max-lg:pt-2">
        <StepRuler
          steps={STEP_NAMES}
          current={number - 1}
          reached={furthest - 1}
          onSelect={(i) => go(flow.find((s) => NUMBER[s] === i + 1) ?? step)}
        />
      </div>
      <h1 className="sr-only">{TITLE[step]}</h1>

      {/* Phones and tablets: the comp card folds into a strip above the form. */}
      <div ref={stripRef} className="apply-in apply-strip paper shrink-0 border border-[#dcdad5] text-[#0a0a0a] lg:hidden">
        <button type="button" aria-expanded={stripOpen} onClick={() => setStripOpen((o) => !o)} className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left">
          {stripRow}
        </button>
        {/* The card folds out from under the strip like paper, and back. */}
        <PaperFold open={stripOpen}>
          <div className="paper px-3.5 pb-3.5">{card('p-0! bg-transparent! border-0!', true)}</div>
        </PaperFold>
      </div>

      {/* The form and the card, centred in the space under the ruler: the card the larger of the two,
          at its own width (zoomed down to fit the screen's height, see above). */}
      <div ref={gridRef} className="grid gap-12 lg:flex-1 lg:grid-cols-[minmax(0,480px)_auto] lg:content-start lg:items-start lg:justify-center lg:gap-x-[clamp(40px,5vw,96px)] lg:pb-6">
        <div className="apply-form apply-in flex flex-col gap-12">
          {step === 'you' && (
            <form
              className="relative grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                // Checked here rather than by the browser, so what's missing is said plainly under the
                // button, and the first of it is brought into view (not hidden under the ruler on phones).
                if (!youGaps.length) return next()
                setTried(true)
                const first = e.currentTarget.querySelector<HTMLInputElement>(YOU_FIELDS[youGaps[0]])
                first?.focus({ preventScroll: true })
                first?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
              }}
              noValidate
            >
              {/* What you'll need: a small (i), opened when wanted, so the form can be filled straight away. */}
              <span className="absolute right-0 top-0 z-10">
                <InfoTip label="What you’ll need">{BEFORE}</InfoTip>
              </span>
              <Field label="First name"><input required autoComplete="given-name" className={big} value={d.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
              <Field label="Last name"><input required autoComplete="family-name" className={big} value={d.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
              <Field label="Date of birth" hint={badDate ? 'Check the year (four digits).' : Number.isFinite(age) && age > 0 ? `${age} years old` : undefined}>
                <input required type="date" autoComplete="bday" min="1940-01-01" max={new Date().toISOString().slice(0, 10)} className={big} value={d.birthdate} onChange={(e) => set('birthdate', e.target.value)} />
              </Field>
              <CountrySelect label="Country" value={d.country} onChange={(v) => set('country', v)} />
              <Field label="Email"><input required type="email" autoComplete="email" placeholder="you@email.com" className={big} value={d.email} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Phone"><input required type="tel" autoComplete="tel" placeholder="+972" className={big} value={d.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              <p className="sm:col-span-2 text-[13px] text-muted">{GUARDIAN_AGE} or younger? We’ll ask for a parent or guardian’s consent next.</p>
              <div className="sm:col-span-2">{tried && youGaps.length ? nav('Continue →', false, youNote, true) : nav('Continue →', false, 'Takes about 3 minutes')}</div>
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
              {/* The sizes: pickers (the phone's own wheel, a list on a computer); only the height is a tape. */}
              <div className="grid grid-cols-3 gap-x-6 gap-y-10 sm:gap-x-10">
                {SIZE_KEYS.map((k) => {
                  const value = d[k]
                  return (
                    <label key={k} className="flex min-w-0 flex-col gap-1.5">
                      <span className="truncate text-[12px] uppercase tracking-[0.04em]" style={narrow}>
                        {SIZE_NAME[k]} {k !== 'tshirt' && <span className="text-muted">EU</span>}
                      </span>
                      <span className="relative block">
                        <select
                          value={value}
                          onChange={(e) => set(k, e.target.value)}
                          className={`w-full cursor-pointer appearance-none rounded-none border-b-2 bg-transparent pb-1.5 pr-5 text-[clamp(20px,1.7vw,25px)] font-semibold tabular-nums outline-none ${value ? 'border-fg' : 'border-line text-muted/40 focus-visible:border-fg'}`}
                        >
                          <option value="" disabled>
                            {half(START[k][division])}
                          </option>
                          {SIZE_OPTIONS[k].map((x) => (
                            <option key={x} value={x} className="text-fg">
                              {half(x)}
                            </option>
                          ))}
                        </select>
                        <svg viewBox="0 0 12 8" aria-hidden className="pointer-events-none absolute right-0 top-1/2 w-3 -translate-y-[60%]">
                          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2">
                <ColorSelect label="Hair colour" options={HAIR} value={d.hair} onChange={(v) => set('hair', v)} inputClassName={mid} />
                <ColorSelect label="Eye colour" options={EYES} value={d.eyes} onChange={(v) => set('eyes', v)} iris inputClassName={mid} />
              </div>
              {tried && gaps.length ? nav('Continue →', false, `Still to set: ${gaps.join(', ')}.`, true) : nav('Continue →', false, 'Pick each size.')}
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
                      {/* The empty spot stays as it is under a photo: the photo is laid onto it, as a print onto a form. */}
                      <span className="relative block aspect-[3/4] border-2 border-dashed border-fg/70 group-hover:border-fg">
                        <Silhouette pose={s.pose} className="absolute inset-[12%] text-muted/60" />
                        {!p && <span className="absolute bottom-2 left-2 text-[12px] font-bold uppercase" style={narrow}>+ Add</span>}
                        {p && (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img key={p.url} src={p.url} alt={s.label} className="photo-paste absolute -inset-[2px] size-[calc(100%+4px)] max-w-none object-cover" />
                            <span className="absolute bottom-2 right-2 bg-bg px-1.5 py-0.5 text-[11px] font-bold uppercase" style={narrow}>Replace</span>
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
              {/* The @ is always there; only the handle is typed (a pasted @ or profile link is trimmed). */}
              <Field label="Instagram">
                <span className={handleRow}>
                  <span aria-hidden className="pr-0.5">@</span>
                  <input className="min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:text-muted/40" placeholder="handle" autoCapitalize="none" autoCorrect="off" value={d.instagram} onChange={(e) => set('instagram', handleOf(e.target.value))} />
                </span>
              </Field>
              <Field label="TikTok">
                <span className={handleRow}>
                  <span aria-hidden className="pr-0.5">@</span>
                  <input className="min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:text-muted/40" placeholder="handle" autoCapitalize="none" autoCorrect="off" value={d.tiktok} onChange={(e) => set('tiktok', handleOf(e.target.value))} />
                </span>
              </Field>
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

        {/* The card's column: it only keeps the room. The card is its own layer over it, fixed on the
            screen (see above), with room round it for its tilt and shadow, so neither is cut off. */}
        <aside ref={asideRef} aria-label="Your comp card" className="apply-card hidden self-start lg:block">
          <div ref={layerRef} className="fixed z-[5] p-7">
            <div ref={scaleBoxRef} style={{ width: CARD_W }}>
              <div data-card className="origin-top-left" style={{ width: CARD_W }}>{card()}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )

  return (
    <div ref={sheetRef} data-sheet role="dialog" aria-modal="true" aria-label="Become a model" className="fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-none bg-bg text-fg">
      {/* Top bar, as on the model page: the logo (home, asking first if the form was started), and close. */}
      <div ref={barRef} className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-bg px-gutter pb-3 pt-[clamp(16px,2vw,28px)]">
        <Link
          href={sitePath(site)}
          aria-label={`${brand} home`}
          onClick={(e) => {
            if (started && !window.confirm('Leave your application? What you’ve filled in will be lost.')) e.preventDefault()
          }}
        >
          <Logo division={division} className="text-[48px] md:text-[70px]" />
        </Link>
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

/** The check: written large in the middle of the screen, a beat, then it goes small to its place over the words. */
const CHECK_WRITE_MS = 520
const CHECK_HOLD_MS = 160
const CHECK_MOVE_MS = 650
const CHECK_MS = CHECK_WRITE_MS + CHECK_HOLD_MS + CHECK_MOVE_MS
const CHECK_BIG = 2.6

function ReceivedCheck() {
  const ref = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const vh = window.visualViewport?.height ?? innerHeight
    const big = `translate(${innerWidth / 2 - (r.left + r.width / 2)}px, ${vh / 2 - (r.top + r.height / 2)}px) scale(${CHECK_BIG})`
    const hold = (CHECK_WRITE_MS + CHECK_HOLD_MS) / CHECK_MS
    const a = el.animate(
      [
        { transform: big, offset: 0 },
        { transform: big, offset: hold, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
        { transform: 'none', offset: 1 },
      ],
      { duration: CHECK_MS },
    )
    return () => a.cancel()
  }, [])
  return (
    <svg ref={ref} aria-hidden width={44} height={44} viewBox="0 0 44 44" className="shrink-0 overflow-visible">
      <polyline points="4,22 16,34 40,8" pathLength={1} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="butt" strokeLinejoin="miter" className="check-write" style={{ animationDuration: `${CHECK_WRITE_MS}ms` }} />
    </svg>
  )
}
