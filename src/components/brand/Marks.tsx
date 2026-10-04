/**
 * Brand symbols.  ” = INCH” (women)   ■ = DOT. (men)
 * Quote-mark paths come from the INCH” Brand file (1920×1080 artboard coords).
 */
type MarkProps = { height?: number; className?: string; style?: React.CSSProperties }

const LEFT_PATH =
  'M651 846V729.222C677.403 723.661 699.637 711.149 717.703 691.686C735.768 672.223 749.664 647.199 759.392 616.614C770.509 584.639 776.068 549.884 776.068 512.348H663.507V235H907.388V483.154C907.388 563.786 894.882 629.821 869.868 681.259C846.244 732.697 814.283 771.623 773.983 798.038C735.073 823.061 694.079 839.049 651 846Z'
const RIGHT_PATH =
  'M1009.53 846V729.222C1035.93 723.661 1058.16 711.149 1076.23 691.686C1094.3 672.223 1108.19 647.199 1117.92 616.614C1129.04 584.639 1134.59 549.884 1134.59 512.348H1022.03V235H1268V483.154C1268 563.786 1255.49 629.821 1230.48 681.259C1205.47 732.697 1173.5 771.623 1134.59 798.038C1095.68 823.061 1054 839.049 1009.53 846Z'

/** Single stroke of the ” mark — width/height ratio 256/611. */
export const STROKE_RATIO = 256 / 611
/** Gap between the two strokes relative to height. */
export const STROKE_GAP_RATIO = 102 / 611

export function QuoteStroke({ side = 'left', height = 64, className, style }: MarkProps & { side?: 'left' | 'right' }) {
  const left = side === 'left'
  return (
    <svg
      viewBox={left ? '651 235 256.388 611' : '1009.53 235 258.47 611'}
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
    <svg viewBox="651 235 617 611" width={Math.round(height * (617 / 611))} height={height} fill="none" aria-hidden className={className} style={{ display: 'block', ...style }}>
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
