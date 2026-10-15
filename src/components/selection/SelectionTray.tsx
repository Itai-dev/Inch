'use client'

import Image from 'next/image'
import { useState } from 'react'
import { isPlaceholder } from '@/lib/placeholders'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import { useSelection } from './SelectionProvider'

export function SelectionTray({ site }: { site: Site }) {
  const { items, remove, clear, open, setOpen } = useSelection()
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  // The link made for this exact selection (changing the selection asks for a new one).
  const key = items.map((i) => i._id).join(',')
  const [made, setMade] = useState<{ key: string; url: string } | null>(null)
  const link = made?.key === key ? made.url : null
  const [state, setState] = useState<'idle' | 'saving' | 'error' | 'copied'>('idle')
  // The selection as comp cards: one PDF, a page a model, each linking to her page on the site.
  const compCards = `${sitePath(site, '/comp-cards')}?ids=${items.map((i) => i._id).join(',')}`
  const real = items.filter((t) => !isPlaceholder(t)).length

  /** Makes the selection's own page (with its comp cards), then hands its link to the device's share sheet where there is one. */
  async function share() {
    setState('saving')
    try {
      let url = link
      if (!url) {
        const res = await fetch('/api/selection', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, note, division: SITES[site].division, talentIds: items.map((i) => i._id) }),
        })
        if (!res.ok) throw new Error()
        url = (await res.json()).url as string
        setMade({ key, url })
      }
      setState('idle')
      if (navigator.share) await navigator.share({ title: title || `${SITES[site].brand} selection`, url }).catch(() => {})
    } catch {
      setState('error')
    }
  }
  const reset = () => {
    clear()
    setMade(null)
  }

  // Always there, so it can slide: in from the right as it opens, back out as it closes (with the
  // shade fading behind it). Hidden from clicks, focus and screen readers while shut.
  return (
    <div
      inert={!open}
      aria-hidden={!open || undefined}
      className={`fixed inset-0 z-50 flex justify-end transition-[visibility] duration-500 ${open ? 'visible' : 'invisible'}`}
      onClick={() => setOpen(false)}
    >
      {/* Fluted glass over the page: blurred, and reeded into vertical stripes of light and shade. */}
      <span aria-hidden className={`fluted-glass absolute inset-0 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside
        className={`relative flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto bg-bg p-6 shadow-[-24px_0_48px_-24px_rgb(0_0_0/0.35)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Selection"
      >
        <div className="flex items-center justify-between">
          <h2 className="wordmark text-[32px] uppercase leading-none">Selection ({items.length})</h2>
          <button onClick={() => setOpen(false)} aria-label="Close" className="hover:opacity-60">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
              <path d="M3 3l18 18M21 3L3 21" stroke="currentColor" strokeWidth="3" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-muted">Add talents with the + button to build a selection.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-3">
            {items.map((t) => (
              <li key={t._id} className="relative">
                <div className="relative aspect-[3/4] bg-line">
                  {t.cover?.asset && (
                    <Image src={urlFor(t.cover).width(300).height(400).url()} alt={t.name} fill sizes="120px" className="object-cover" />
                  )}
                </div>
                <p className="wordmark mt-1.5 truncate text-[15px] uppercase">{t.name}</p>
                <button onClick={() => remove(t._id)} className="absolute right-1 top-1 bg-bg px-1 text-xs" aria-label={`Remove ${t.name}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="mt-auto flex flex-col gap-3 border-t border-line pt-6">
            {/* Share: the selection's own page, with every model, her measurements and the comp cards. */}
            {!link && (
              <>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Client — Campaign SS27)" className="border-b border-line bg-transparent py-2 outline-none focus:border-fg" />
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the client (optional)" rows={2} className="resize-none border-b border-line bg-transparent py-2 outline-none focus:border-fg" />
              </>
            )}
            {link ? (
              <div className="flex flex-col gap-2">
                <input readOnly value={link} onFocus={(e) => e.target.select()} className="border-b border-line bg-transparent py-2 text-sm" />
                <div className="grid grid-cols-3 gap-2 text-[13px] font-bold uppercase tracking-[0.04em]" style={{ fontStretch: '80%' }}>
                  <button onClick={() => navigator.clipboard.writeText(link).then(() => setState('copied'))} className="h-11 border border-fg uppercase hover:bg-fg hover:text-bg">{state === 'copied' ? 'Copied' : 'Copy link'}</button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer" className="grid h-11 place-items-center border border-fg hover:bg-fg hover:text-bg">WhatsApp</a>
                  <a href={`mailto:?subject=${encodeURIComponent(title || `${SITES[site].brand} selection`)}&body=${encodeURIComponent(link)}`} className="grid h-11 place-items-center border border-fg hover:bg-fg hover:text-bg">Email</a>
                </div>
              </div>
            ) : (
              <button onClick={share} disabled={state === 'saving'} className="flex h-12 items-center justify-center text-[14px] font-bold uppercase tracking-[0.04em] bg-fg text-bg hover:opacity-85 disabled:opacity-50" style={{ fontStretch: '80%' }}>
                {state === 'saving' ? 'Making the link…' : 'Share selection'}
              </button>
            )}
            {state === 'error' && <p className="text-sm text-red-600">Couldn’t make the link. Try again.</p>}
            {real > 0 && (
              <a href={compCards} download className="flex h-12 items-center justify-center text-[14px] font-bold uppercase tracking-[0.04em] border border-fg hover:bg-fg hover:text-bg" style={{ fontStretch: '80%' }}>
                {real > 1 ? `Comp cards (${real}) · PDF` : 'Comp card · PDF'}
              </a>
            )}
            <button onClick={reset} className="text-sm text-muted underline">Clear selection</button>
          </div>
        )}
      </aside>
    </div>
  )
}
