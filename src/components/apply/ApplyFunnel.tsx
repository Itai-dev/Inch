'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { GUARDIAN_AGE, meetsCriteria } from '@/lib/apply-criteria'
import type { Division } from '@/sanity/lib/types'

type Data = {
  division?: Division
  name: string
  age: string
  city: string
  email: string
  phone: string
  guardianName: string
  guardianPhone: string
  height: string
  bust: string
  waist: string
  hips: string
  shoes: string
  instagram: string
  experience: string
  consent: boolean
}

type Step = 'division' | 'basics' | 'guardian' | 'measurements' | 'digitals' | 'socials' | 'declined' | 'done'

const initial: Data = {
  name: '', age: '', city: '', email: '', phone: '', guardianName: '', guardianPhone: '',
  height: '', bust: '', waist: '', hips: '', shoes: '', instagram: '', experience: '', consent: false,
}

const input = 'w-full border border-line px-3 py-3 outline-none focus:border-fg'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm uppercase tracking-wide">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  )
}

export function ApplyFunnel() {
  const [step, setStep] = useState<Step>('division')
  const [d, setD] = useState<Data>(initial)
  const [photos, setPhotos] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof Data>(k: K, v: Data[K]) => setD((p) => ({ ...p, [k]: v }))

  const isMinor = Number(d.age) > 0 && Number(d.age) < GUARDIAN_AGE
  const flow: Step[] = useMemo(
    () => ['division', 'basics', ...(isMinor ? (['guardian'] as Step[]) : []), 'measurements', 'digitals', 'socials'],
    [isMinor],
  )
  const index = flow.indexOf(step)
  const next = () => setStep(flow[index + 1])
  const back = () => setStep(flow[Math.max(0, index - 1)])

  function afterMeasurements() {
    if (!d.division) return
    if (!meetsCriteria(d.division, Number(d.age), Number(d.height))) setStep('declined')
    else next()
  }

  async function submit() {
    setSending(true)
    setError(null)
    const fd = new FormData()
    Object.entries(d).forEach(([k, v]) => fd.append(k, String(v ?? '')))
    photos.forEach((f) => fd.append('digitals', f))
    const res = await fetch('/api/apply', { method: 'POST', body: fd }).catch(() => null)
    setSending(false)
    if (res?.ok) setStep('done')
    else setError('Something went wrong. Please try again.')
  }

  if (step === 'done')
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-bold">Thank you.</h2>
        <p className="text-muted">Our scouting team reviews every application. If there’s a fit, we’ll be in touch.</p>
      </div>
    )

  if (step === 'declined')
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-bold">Thank you for your interest.</h2>
        <p className="text-muted">Right now we’re looking for different requirements. Follow us on Instagram for open castings.</p>
        <Link href="/" className="text-sm uppercase underline">Back to home</Link>
      </div>
    )

  return (
    <div className="flex flex-col gap-8">
      <ol className="flex gap-2" aria-label="Progress">
        {flow.map((s, i) => (
          <li key={s} className={`h-1 flex-1 ${i <= index ? 'bg-fg' : 'bg-line'}`} />
        ))}
      </ol>

      {step === 'division' && (
        <div className="grid gap-4 md:grid-cols-2">
          {(['women', 'men'] as Division[]).map((v) => (
            <button key={v} onClick={() => { set('division', v); setStep('basics') }} className="border border-fg p-10 text-left text-3xl font-bold">
              {v === 'women' ? 'INCH” Women' : 'DOT. Men'}
            </button>
          ))}
        </div>
      )}

      {step === 'basics' && (
        <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); next() }}>
          <Field label="Full name"><input required className={input} value={d.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Age"><input required type="number" min={10} max={80} className={input} value={d.age} onChange={(e) => set('age', e.target.value)} /></Field>
          <Field label="City"><input required className={input} value={d.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label="Email"><input required type="email" className={input} value={d.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Phone"><input required type="tel" className={input} value={d.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Nav onBack={back} />
        </form>
      )}

      {step === 'guardian' && (
        <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); next() }}>
          <p className="text-muted">Applicants under {GUARDIAN_AGE} need a parent or guardian’s details.</p>
          <Field label="Guardian name"><input required className={input} value={d.guardianName} onChange={(e) => set('guardianName', e.target.value)} /></Field>
          <Field label="Guardian phone"><input required type="tel" className={input} value={d.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} /></Field>
          <Nav onBack={back} />
        </form>
      )}

      {step === 'measurements' && (
        <form className="grid grid-cols-2 gap-5" onSubmit={(e) => { e.preventDefault(); afterMeasurements() }}>
          <Field label="Height (cm)"><input required type="number" className={input} value={d.height} onChange={(e) => set('height', e.target.value)} /></Field>
          <Field label={d.division === 'men' ? 'Chest (cm)' : 'Bust (cm)'}><input type="number" className={input} value={d.bust} onChange={(e) => set('bust', e.target.value)} /></Field>
          <Field label="Waist (cm)"><input type="number" className={input} value={d.waist} onChange={(e) => set('waist', e.target.value)} /></Field>
          <Field label="Hips (cm)"><input type="number" className={input} value={d.hips} onChange={(e) => set('hips', e.target.value)} /></Field>
          <Field label="Shoes (EU)"><input type="number" className={input} value={d.shoes} onChange={(e) => set('shoes', e.target.value)} /></Field>
          <div className="col-span-2"><Nav onBack={back} /></div>
        </form>
      )}

      {step === 'digitals' && (
        <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); next() }}>
          <p className="text-muted">Natural light, no makeup, fitted clothing. Front, profile and full length.</p>
          <Field label="Photos (2–5)">
            <input required type="file" accept="image/jpeg,image/png,image/webp" multiple className={input}
              onChange={(e) => setPhotos(Array.from(e.target.files || []).slice(0, 5))} />
          </Field>
          {photos.length > 0 && <p className="text-sm text-muted">{photos.length} selected</p>}
          <Nav onBack={back} disabled={photos.length < 2} />
        </form>
      )}

      {step === 'socials' && (
        <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <Field label="Instagram"><input className={input} placeholder="@handle" value={d.instagram} onChange={(e) => set('instagram', e.target.value)} /></Field>
          <Field label="Experience (optional)"><textarea rows={3} className={input} value={d.experience} onChange={(e) => set('experience', e.target.value)} /></Field>
          <label className="flex items-start gap-3 text-sm">
            <input required type="checkbox" checked={d.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-1" />
            <span>I agree that INCH” may store and review my details and photos for scouting, as described in the <Link href="/privacy" className="underline">privacy policy</Link>.</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Nav onBack={back} label={sending ? 'Sending…' : 'Submit application'} disabled={sending} />
        </form>
      )}
    </div>
  )
}

function Nav({ onBack, label = 'Continue', disabled }: { onBack: () => void; label?: string; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between pt-4">
      <button type="button" onClick={onBack} className="text-sm uppercase text-muted">Back</button>
      <button type="submit" disabled={disabled} className="bg-fg px-8 py-3 text-sm uppercase tracking-wide text-bg disabled:opacity-40">{label}</button>
    </div>
  )
}
