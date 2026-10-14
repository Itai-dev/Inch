'use client'

/**
 * The funnel's progress as a short, fixed INCH” ruler across the top: one numbered segment
 * per step, a bar that slides to the current one. The step names are the page's only titles:
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
            const tone = i === current ? 'text-fg' : i <= reached ? 'text-fg/65' : 'text-muted/50'
            return (
              <li key={name}>
                <button
                  type="button"
                  disabled={i > reached}
                  onClick={() => onSelect(i)}
                  aria-current={i === current ? 'step' : undefined}
                  aria-label={`${String(i + 1).padStart(2, '0')} ${name}`}
                  className={`flex w-full flex-col items-start gap-2 text-left transition-colors enabled:hover:text-fg disabled:cursor-default ${tone}`}
                >
                  <span className="flex items-baseline gap-2 leading-none">
                    <span className="text-[13px] font-extrabold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`wordmark uppercase max-sm:hidden ${i === current ? 'text-[clamp(20px,1.8vw,26px)]' : 'text-[15px]'}`}>{name}</span>
                  </span>
                  <span
                    aria-hidden
                    className="block h-4 w-full border-l-2 border-current"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 9px)',
                      backgroundSize: '100% 6px',
                      backgroundPosition: 'left bottom',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                </button>
              </li>
            )
          })}
        </ol>
        {/* The highlight: slides under the current step's ticks. */}
        <span
          aria-hidden
          className="absolute -bottom-1 block h-[3px] bg-fg transition-[left] duration-500 ease-[var(--ease-out)]"
          style={{ left: `${(current / n) * 100}%`, width: `${100 / n}%` }}
        />
      </div>
      <p aria-hidden className="wordmark mt-3 text-[24px] uppercase sm:hidden" style={{ marginLeft: `${(current / n) * 100}%` }}>
        {steps[current]}
      </p>
    </nav>
  )
}
