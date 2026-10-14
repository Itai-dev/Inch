'use client'

import { rulerTicks } from '@/lib/ruler'

/**
 * The funnel's progress as a short, fixed INCH” ruler across the top, drawn like the hero's:
 * one numbered segment per step, the current one at full strength and the rest faded. The step names are the page's only titles:
 * the current one larger. Steps already reached can be clicked to go back. Phones show the
 * numbers on the ruler and the current name under it, so the names don't run into each other.
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
                  className={`flex w-full flex-col items-start gap-2 text-left transition-opacity duration-500 disabled:cursor-default ${tone}`}
                >
                  <span className="flex items-baseline gap-2 leading-none">
                    <span className="text-[13px] font-bold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`wordmark uppercase max-sm:hidden ${i === current ? 'text-[clamp(20px,1.8vw,26px)]' : 'text-[15px]'}`}>{name}</span>
                  </span>
                  <span aria-hidden className="block h-4 w-full" style={rulerTicks(16, 29)} />
                </button>
              </li>
            )
          })}
        </ol>
        {/* The ruler's closing tick. */}
        <span aria-hidden className="absolute bottom-0 right-0 block h-4 w-px bg-current opacity-25" />
      </div>
      <p aria-hidden className="wordmark mt-3 text-[24px] uppercase sm:hidden" style={{ marginLeft: `${(current / n) * 100}%` }}>
        {steps[current]}
      </p>
    </nav>
  )
}
