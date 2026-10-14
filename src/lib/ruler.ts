/**
 * The INCH” ruler's ticks for one numbered segment: a full tick at the start, a taller one in the
 * middle, short ones between (`minors` of them, odd so the middle one lands on a tick). Every
 * ruler on the site draws its segments with this, so they all read as the same ruler.
 */
export function rulerTicks(tickH: number, minors: number, segW?: number) {
  const majorW = tickH >= 24 ? 2 : 1
  // In px when the segment's width is known, else as a share of the segment.
  const sub = segW ? `${segW / (minors + 1)}px` : `${100 / (minors + 1)}%`
  return {
    backgroundImage: [
      'linear-gradient(currentColor, currentColor)',
      'linear-gradient(currentColor, currentColor)',
      `repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px ${sub})`,
    ].join(','),
    backgroundSize: `${majorW}px ${tickH}px, 1px ${Math.round(tickH * 0.7)}px, 100% ${Math.round(tickH * 0.45)}px`,
    backgroundPosition: 'left bottom, 50% bottom, left bottom',
    backgroundRepeat: 'no-repeat',
  } as const
}

/** The same ruler standing up, ticks growing from its left edge (`tickW` long), a segment as tall as its box. */
export function rulerTicksDown(tickW: number, minors: number) {
  const sub = `${100 / (minors + 1)}%`
  return {
    backgroundImage: [
      'linear-gradient(currentColor, currentColor)',
      'linear-gradient(currentColor, currentColor)',
      `repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px ${sub})`,
    ].join(','),
    backgroundSize: `${tickW}px 2px, ${Math.round(tickW * 0.62)}px 1px, ${Math.round(tickW * 0.35)}px 100%`,
    backgroundPosition: 'left top, left 50%, left top',
    backgroundRepeat: 'no-repeat',
  } as const
}

/** A segment of any width at a fixed pitch: a full tick at the start, short ones every `pitch` px. */
export function rulerTicksPitch(tickH: number, pitch: number) {
  return {
    backgroundImage: ['linear-gradient(currentColor, currentColor)', `repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px ${pitch}px)`].join(','),
    backgroundSize: `2px ${tickH}px, 100% ${Math.round(tickH * 0.45)}px`,
    backgroundPosition: 'left bottom, left bottom',
    backgroundRepeat: 'no-repeat',
  } as const
}
