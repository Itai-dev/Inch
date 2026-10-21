'use client'

import Image from 'next/image'
import { useState } from 'react'
import { isPlaceholder } from '@/lib/placeholders'
import { enquiryMailto } from '@/lib/enquiry'
import { sitePath, SITES, type Site } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import { useSelection } from './SelectionProvider'

export function SelectionTray({ site, email }: { site: Site; email: string }) {
  const { items, remove, clear, open, setOpen } = useSelection()
  // The selection as comp cards: one PDF, a page a model, each linking to her page on the site.
  const compCards = `${sitePath(site, '/comp-cards')}?ids=${items.map((i) => i._id).join(',')}`
  const real = items.filter((t) => !isPlaceholder(t)).length
  const name = real > 1 ? `${SITES[site].brand} comp cards` : 'Comp card'
  const [state, setState] = useState<'idle' | 'making' | 'link' | 'copied' | 'error'>('idle')
  // The link to the PDF itself, for when the device can't share the file.
  const pdfLink = typeof location === 'undefined' ? compCards : location.origin + compCards
  // The shortlist, straight to the agency as a booking enquiry (the comp cards linked in it).
  const request = enquiryMailto(email, { brand: SITES[site].brand, models: items.map((t) => t.name), link: real ? `Comp cards: ${pdfLink}` : undefined })

  /**
   * Shares the comp cards: the PDF itself through the device's share sheet where it can take a
   * file (phones, most desktops), else the PDF's link there, else the link to copy or send.
   */
  async function share() {
    setState('making')
    try {
      const res = await fetch(compCards)
      if (!res.ok) throw new Error()
      const file = new File([await res.blob()], `${site}-comp-cards.pdf`, { type: 'application/pdf' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name }).catch(() => {})
        setState('idle')
      } else if (navigator.share) {
        await navigator.share({ title: name, url: pdfLink }).catch(() => {})
        setState('idle')
      } else setState('link')
    } catch {
      setState('error')
    }
  }

  // Always there, so it can slide: in from the right as it opens, back out as it closes. The page
  // behind stays as it is (a click on it closes the tray). Hidden from clicks, focus and screen readers while shut.
  return (
    <div
      inert={!open}
      aria-hidden={!open || undefined}
      className={`fixed inset-0 z-50 flex justify-end transition-[visibility] duration-500 ${open ? 'visible' : 'invisible'}`}
      onClick={() => setOpen(false)}
    >
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
          <p className="text-muted">Add models with the + button to build your shortlist, then send it to us as one request, or share it as comp cards.</p>
        ) : (
          // The first model large, the pictures getting smaller as more are added.
          <ul className={`grid gap-3 ${items.length === 1 ? 'grid-cols-1' : items.length === 2 ? 'grid-cols-2' : items.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {items.map((t) => (
              <li key={t._id} className="relative">
                <div className="relative aspect-[3/4] bg-line">
                  {t.cover?.asset && (
                    <Image src={urlFor(t.cover).width(items.length === 1 ? 900 : 450).height(items.length === 1 ? 1200 : 600).url()} alt={t.name} fill sizes={items.length === 1 ? "440px" : "220px"} className="object-cover" />
                  )}
                </div>
                <p className={`wordmark mt-1.5 truncate uppercase ${items.length === 1 ? 'text-[26px]' : items.length === 2 ? 'text-[19px]' : 'text-[15px]'}`}>{t.name}</p>
                <button onClick={() => remove(t._id)} className="absolute right-1 top-1 bg-bg px-1 text-xs" aria-label={`Remove ${t.name}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="mt-auto flex flex-col gap-3 border-t border-line pt-6">
            <a href={request} className="flex h-12 items-center justify-center bg-fg text-[14px] font-bold uppercase tracking-[0.04em] text-bg hover:opacity-85" style={{ fontStretch: '80%' }}>
              {items.length > 1 ? `Request these ${items.length} models →` : 'Request this model →'}
            </a>
            {real > 0 ? (
              <>
                <button onClick={share} disabled={state === 'making'} className="flex h-12 items-center justify-center border border-fg text-[14px] font-bold uppercase tracking-[0.04em] hover:bg-fg hover:text-bg disabled:opacity-50" style={{ fontStretch: '80%' }}>
                  {state === 'making' ? 'Making the PDF…' : real > 1 ? `Share comp cards (${real})` : 'Share comp card'}
                </button>
                {(state === 'link' || state === 'copied') && (
                  <div className="grid grid-cols-3 gap-2 text-[13px] font-bold uppercase tracking-[0.04em]" style={{ fontStretch: '80%' }}>
                    <button onClick={() => navigator.clipboard.writeText(pdfLink).then(() => setState('copied'))} className="h-11 border border-fg uppercase hover:bg-fg hover:text-bg">
                      {state === 'copied' ? 'Copied' : 'Copy link'}
                    </button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(pdfLink)}`} target="_blank" rel="noreferrer" className="grid h-11 place-items-center border border-fg hover:bg-fg hover:text-bg">WhatsApp</a>
                    <a href={`mailto:?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(pdfLink)}`} className="grid h-11 place-items-center border border-fg hover:bg-fg hover:text-bg">Email</a>
                  </div>
                )}
                {state === 'error' && <p className="text-sm text-red-600">Couldn’t make the PDF. Try again.</p>}
                <a href={compCards} download className="flex h-12 items-center justify-center text-[14px] font-bold uppercase tracking-[0.04em] border border-fg hover:bg-fg hover:text-bg" style={{ fontStretch: '80%' }}>
                  Download PDF
                </a>
              </>
            ) : (
              <p className="text-sm text-muted">Comp cards are made for models in the Studio; placeholders don’t have one.</p>
            )}
            <button onClick={clear} className="text-sm text-muted underline">Clear selection</button>
          </div>
        )}
      </aside>
    </div>
  )
}
