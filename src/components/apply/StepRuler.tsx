'use client'

/**
 * The funnel's progress as a short, fixed INCH” ruler: one numbered segment per step, a bar
 * that slides to the current one. Steps already reached can be clicked to go back. Phones
 * name only the current step, so the names don't run into each other.
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
    <nav aria-label="Application steps" className="relative w-full select-none">
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {steps.map((name, i) => {
          const tone = i === current ? 'text-fg' : i <= reached ? 'text-fg/70' : 'text-muted/50'
          return (
            <li key={name}>
              <button
                type="button"
                disabled={i > reached}
                onClick={() => onSelect(i)}
                aria-current={i === current ? 'step' : undefined}
                className={`flex w-full flex-col items-start gap-1.5 text-left transition-colors enabled:hover:text-fg disabled:cursor-default ${tone}`}
              >
                <span className="text-[14px] font-extrabold leading-none tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span
                  aria-hidden
                  className="block h-[18px] w-full border-l-2 border-current"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 10px)',
                    backgroundSize: '100% 7px',
                    backgroundPosition: 'left bottom',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <span className={`text-[11px] font-bold uppercase tracking-[0.04em] ${i === current ? '' : 'max-sm:invisible'}`} style={{ fontStretch: '80%' }}>{name}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {/* The highlight: slides under the current step's ticks. */}
      <span
        aria-hidden
        className="absolute top-[38px] block h-[3px] bg-fg transition-[left] duration-500 ease-[var(--ease-out)]"
        style={{ left: `${(current / n) * 100}%`, width: `${100 / n}%` }}
      />
    </nav>
  )
}
