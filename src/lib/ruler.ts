/**
 * The INCH” ruler, as on the hero: every tick the same 1px line, a full one at each end of an
 * inch, a taller one in the middle, short ones between (`minors` of them, odd so the middle one
 * lands on a tick). Its number or name sits centred over the inch. Each inch draws both of its
 * end ticks, so one lit inch is lit whole: give a segment 1px more than its share
 * (`SEG_OVERLAP`) so its closing tick lands exactly on the next one's opening tick. Every ruler
 * on the site draws its inches with these.
 */
export const SEG_OVERLAP = '1px'

export function rulerTicks(tickH: number, minors: number, segW?: number) {
  // In px when the segment's width is known, else as a share of the segment.
  const sub = segW ? `${segW / (minors + 1)}px` : `${100 / (minors + 1)}%`
  const line = 'linear-gradient(currentColor, currentColor)'
  // The middle tick drawn across the whole inch, as the short ones are, so it lands on exactly the
  // same pixel as the short tick under it (a 1px image placed at 50% rounds differently).
  const mid = 'linear-gradient(to right, transparent 50%, currentColor 50% calc(50% + 1px), transparent calc(50% + 1px))'
  return {
    backgroundImage: [line, line, mid, `repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px ${sub})`].join(','),
    backgroundSize: `1px ${tickH}px, 1px ${tickH}px, 100% ${Math.round(tickH * 0.7)}px, 100% ${Math.round(tickH * 0.45)}px`,
    backgroundPosition: 'left bottom, right bottom, left bottom, left bottom',
    backgroundRepeat: 'no-repeat',
  } as const
}

/** The same ruler standing up, ticks growing from its left edge (`tickW` long), an inch as tall as its box. */
export function rulerTicksDown(tickW: number, minors: number) {
  const sub = `${100 / (minors + 1)}%`
  const line = 'linear-gradient(currentColor, currentColor)'
  return {
    backgroundImage: [line, line, 'linear-gradient(to bottom, transparent 50%, currentColor 50% calc(50% + 1px), transparent calc(50% + 1px))', `repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px ${sub})`].join(','),
    backgroundSize: `${tickW}px 1px, ${tickW}px 1px, ${Math.round(tickW * 0.7)}px 100%, ${Math.round(tickW * 0.45)}px 100%`,
    backgroundPosition: 'left top, left bottom, left top, left top',
    backgroundRepeat: 'no-repeat',
  } as const
}

/** An inch of any width at a fixed pitch: full ticks at both ends, short ones every `pitch` px. */
export function rulerTicksPitch(tickH: number, pitch: number) {
  const line = 'linear-gradient(currentColor, currentColor)'
  return {
    backgroundImage: [line, line, `repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px ${pitch}px)`].join(','),
    backgroundSize: `1px ${tickH}px, 1px ${tickH}px, 100% ${Math.round(tickH * 0.45)}px`,
    backgroundPosition: 'left bottom, right bottom, left bottom',
    backgroundRepeat: 'no-repeat',
  } as const
}
