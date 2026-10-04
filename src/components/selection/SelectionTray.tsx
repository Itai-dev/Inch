'use client'

import Image from 'next/image'
import { useState } from 'react'
import { SITES, type Site } from '@/lib/sites'
import { urlFor } from '@/sanity/lib/image'
import { useSelection } from './SelectionProvider'

export function SelectionTray({ site }: { site: Site }) {
  const { items, remove, clear, open, setOpen } = useSelection()
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle')

  async function share() {
    setState('saving')
    try {
      const res = await fetch('/api/selection', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, note, division: SITES[site].division, talentIds: items.map((i) => i._id) }),
      })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      setLink(url)
      setState('idle')
    } catch {
      setState('error')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setOpen(false)}>
      <aside
        className="flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto bg-bg p-6"
        onClick={(e) => e.stopPropagation()}
        aria-label="Selection"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg uppercase tracking-wide">Selection ({items.length})</h2>
          <button onClick={() => setOpen(false)} aria-label="Close">✕</button>
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
                <p className="mt-1 truncate text-xs uppercase">{t.name}</p>
                <button onClick={() => remove(t._id)} className="absolute right-1 top-1 bg-bg px-1 text-xs" aria-label={`Remove ${t.name}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="mt-auto flex flex-col gap-3 border-t border-line pt-6">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Selection title (e.g. Client — Campaign SS27)" className="border border-line px-3 py-2" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the client (optional)" rows={2} className="border border-line px-3 py-2" />
            {link ? (
              <div className="flex flex-col gap-2">
                <input readOnly value={link} className="border border-line px-3 py-2 text-sm" onFocus={(e) => e.target.select()} />
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(link)} className="flex-1 border border-fg py-3 text-sm uppercase">Copy link</button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer" className="flex-1 border border-fg py-3 text-center text-sm uppercase">WhatsApp</a>
                </div>
              </div>
            ) : (
              <button onClick={share} disabled={state === 'saving'} className="bg-fg py-3 text-sm uppercase tracking-wide text-bg disabled:opacity-50">
                {state === 'saving' ? 'Creating link…' : 'Create share link'}
              </button>
            )}
            {state === 'error' && <p className="text-sm text-red-600">Couldn’t create the link. Try again.</p>}
            <button onClick={() => { clear(); setLink(null) }} className="text-sm text-muted underline">Clear selection</button>
          </div>
        )}
      </aside>
    </div>
  )
}
