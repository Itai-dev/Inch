'use client'

import { rulerTicks, SEG_OVERLAP } from '@/lib/ruler'

/**
 * The funnel's progress as a short, fixed INCH” ruler across the top, drawn like the hero's:
 * an inch per step with its number and name centred over it, the current one at full strength
 * (both its end ticks) and the rest faded. The step names are the page's only titles:
 * the current one bolder. Kept small, so the form stays the thing to look at. Steps already
 * reached can be clicked to go back. Phones show the numbers on the ruler and the current name
 * under it, so the names don't run into each other.
 */
export function StepRuler({
  steps,
  current,
  reached,
  onSelect,
}: {
  steps: string[]
  /** 0-based. */
  current: number
  /** Highest step index the applicant has opened. */
  reached: number
  onSelect: (i: number) => void
}) {
  const n = steps.length
  return (
    <nav aria-label="Application steps" className="w-full select-none">
      <div className="relative">
        <ol className="grid items-end" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {steps.map((name, i) => {
            // As on the hero ruler: the current step at full strength, the others faded.
            const tone = i === current ? 'opacity-100' : i <= reached ? 'opacity-40 enabled:hover:opacity-100' : 'opacity-25'
            return (
              <li key={name}>
                <button
                  type="button"
                  disabled={i > reached}
                  onClick={() => onSelect(i)}
                  aria-current={i === current ? 'step' : undefined}
                  aria-label={`${String(i + 1).padStart(2, '0')} ${name}`}
                  className={`flex w-full flex-col items-center gap-1.5 text-center transition-opacity duration-500 disabled:cursor-default ${tone}`}
                >
                  <span className="flex items-baseline justify-center gap-1.5 leading-none">
                    <span className="text-[10px] font-bold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`text-[11px] uppercase tracking-[0.08em] max-sm:hidden ${i === current ? 'font-bold' : ''}`} style={{ fontStretch: '80%' }}>{name}</span>
                  </span>
                  <span aria-hidden className="block h-2 self-start" style={{ width: `calc(100% + ${SEG_OVERLAP})`, ...rulerTicks(8, 9) }} />
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      {/* Phones: the current step's name under its inch, centred on it (it may run past either side). */}
      <p aria-hidden className="mt-1.5 whitespace-nowrap text-center text-[11px] font-bold uppercase tracking-[0.08em] sm:hidden" style={{ marginLeft: `${((current + 0.5) / n) * 100}%`, transform: 'translateX(-50%)', width: 'max-content', fontStretch: '80%' }}>
        {steps[current]}
      </p>
    </nav>
  )
}
