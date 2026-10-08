/**
 * Brand symbols.  ” = INCH” (women)   ■ = DOT. (men)
 * Quote-mark paths: the brand ” SVG (64×72), split into its two strokes.
 */
type MarkProps = { height?: number; className?: string; style?: React.CSSProperties }

export const LEFT_PATH =
  'M0 72V58.2389C3.09415 57.5836 5.69974 56.1092 7.81678 53.8157C9.93383 51.5222 11.5623 48.5734 12.7023 44.9693C14.0051 41.2014 14.6565 37.1058 14.6565 32.6826H1.46566V0H30.0458V29.2423C30.0458 38.744 28.5801 46.5256 25.6488 52.587C22.8804 58.6485 19.1349 63.2355 14.4122 66.3481C9.85244 69.2969 5.04834 71.1809 0 72Z'
export const RIGHT_PATH =
  'M33.7099 72V58.2389C36.8041 57.5836 39.4097 56.1092 41.5267 53.8157C43.6438 51.5222 45.2723 48.5734 46.4122 44.9693C47.715 41.2014 48.3664 37.1058 48.3664 32.6826H35.1756V0H64V29.2423C64 38.744 62.5344 46.5256 59.6031 52.587C56.6718 58.6485 52.9262 63.2355 48.3664 66.3481C43.8066 69.2969 38.9211 71.1809 33.7099 72Z'

/** Single stroke of the ” mark — width/height ratio. */
export const STROKE_RATIO = 30.0458 / 72
/** Gap between the two strokes relative to height. */
export const STROKE_GAP_RATIO = (33.7099 - 30.0458) / 72

export function QuoteStroke({ side = 'left', height = 64, className, style }: MarkProps & { side?: 'left' | 'right' }) {
  const left = side === 'left'
  return (
    <svg
      viewBox={left ? '0 0 30.0458 72' : '33.7099 0 30.2901 72'}
      width={Math.round(height * STROKE_RATIO)}
      height={height}
      fill="none"
      aria-hidden
      className={className}
      style={{ display: 'block', ...style }}
    >
      <path d={left ? LEFT_PATH : RIGHT_PATH} fill="currentColor" />
    </svg>
  )
}

export function QuoteMark({ height = 64, className, style }: MarkProps) {
  return (
    <svg viewBox="0 0 64 72" width={Math.round(height * (64 / 72))} height={height} fill="none" aria-hidden className={className} style={{ display: 'block', ...style }}>
      <path d={LEFT_PATH} fill="currentColor" />
      <path d={RIGHT_PATH} fill="currentColor" />
    </svg>
  )
}

export function SquareDot({ size = 16, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={className} style={{ display: 'inline-block', width: size, height: size, background: 'currentColor', ...style }} />
}

export function DivisionMark({ division, size = 16 }: { division: 'women' | 'men'; size?: number }) {
  return division === 'men' ? <SquareDot size={size * 0.7} /> : <QuoteMark height={size} />
}
