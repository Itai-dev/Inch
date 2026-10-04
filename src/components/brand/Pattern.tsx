import { QuoteMark, SquareDot } from './Marks'

/** ” and ■ alternating pattern (brand slide 16/17). DOT. version uses ■ only. */
export function Pattern({ variant = 'inch', rows = 3, cols = 12, className = '' }: { variant?: 'inch' | 'dot'; rows?: number; cols?: number; className?: string }) {
  return (
    <div aria-hidden className={`grid place-items-center gap-y-10 ${className}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols)
        const quote = variant === 'inch' && (i + r) % 2 === 0
        if (variant === 'dot' && (i + r) % 2 === 1) return <span key={i} />
        return quote ? <QuoteMark key={i} height={28} /> : <SquareDot key={i} size={10} />
      })}
    </div>
  )
}
