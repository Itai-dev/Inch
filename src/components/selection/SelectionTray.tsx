'use client'

import Image from 'next/image'
import { isPlaceholder } from '@/lib/placeholders'
import { sitePath, type Site } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import { useSelection } from './SelectionProvider'

export function SelectionTray({ site }: { site: Site }) {
  const { items, remove, clear, open, setOpen } = useSelection()
  // The selection as comp cards: one PDF, a page a model, each linking to her page on the site.
  const compCards = `${sitePath(site, '/comp-cards')}?ids=${items.map((i) => i._id).join(',')}`
  const real = items.filter((t) => !isPlaceholder(t)).length

  // Always there, so it can slide: in from the right as it opens, back out as it closes (with the
  // shade fading behind it). Hidden from clicks, focus and screen readers while shut.
  return (
    <div
      inert={!open}
      aria-hidden={!open || undefined}
      className={`fixed inset-0 z-50 flex justify-end transition-[background-color,backdrop-filter,visibility] duration-500 ${open ? 'visible bg-bg/25 backdrop-blur-xl' : 'invisible bg-bg/0 backdrop-blur-none'}`}
      onClick={() => setOpen(false)}
    >
      <aside
        className={`flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto bg-bg p-6 shadow-[-24px_0_48px_-24px_rgb(0_0_0/0.35)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'translate-x-0' : 'translate-x-full'}`}
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
            {real ? (
              <a href={compCards} download className="flex h-12 items-center justify-center bg-fg text-[14px] font-bold uppercase tracking-[0.04em] text-bg hover:opacity-85" style={{ fontStretch: '80%' }}>
                {real > 1 ? `Comp cards (${real}) · PDF` : 'Comp card · PDF'}
              </a>
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
