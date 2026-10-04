'use client'

import Image from 'next/image'
import { useState } from 'react'
import { DotIndexCarousel } from './motion/DotIndexCarousel'
import { TapeCarousel } from './motion/TapeCarousel'
import type { Slide } from './motion/types'

type View = 'book' | 'thumbnails'

/** One model book: the brand carousel, or every image at once as thumbnails. */
export function BookViewer({ slides, isDot, defaultView = 'book' }: { slides: Slide[]; isDot: boolean; defaultView?: View }) {
  const [view, setView] = useState<View>(defaultView)
  const [start, setStart] = useState(0)

  return (
    <div className="flex flex-col gap-4">
      <div className="label flex justify-end gap-4 px-5 md:px-10" role="group" aria-label="View">
        {(['book', 'thumbnails'] as View[]).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={`uppercase ${view === v ? 'text-fg' : 'text-muted hover:text-fg'}`}>
            {v === 'book' ? 'Book' : 'Thumbnails'}
          </button>
        ))}
      </div>

      {view === 'book' ? (
        isDot ? (
          <DotIndexCarousel key={start} slides={slides} height="90dvh" start={start} />
        ) : (
          <TapeCarousel key={start} slides={slides} height="92dvh" start={start} />
        )
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 px-5 md:grid-cols-4 md:px-10">
          {slides.map((s, i) => (
            <li key={s.id}>
              <button type="button" onClick={() => { setStart(i); setView('book') }} className="block w-full text-left" aria-label={`Open ${s.alt}`}>
                <span className="relative block aspect-[3/4] bg-line">
                  <Image src={s.src} alt={s.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
                </span>
                {s.caption && <span className="mt-2 block text-[10px] uppercase tracking-wide text-muted">{s.caption}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
