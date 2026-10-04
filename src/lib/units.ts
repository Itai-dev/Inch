/** Inches rounded to the nearest ½, written the agency way: 32½″ */
const halves = (inches: number) => {
  const r = Math.round(inches * 2) / 2
  return `${Math.floor(r)}${r % 1 ? '½' : ''}`
}

export const cmToInches = (cm: number) => `${halves(cm / 2.54)}″`

/** 177 → 5′9½″ */
export const cmToFeet = (cm: number) => {
  const total = Math.round((cm / 2.54) * 2) / 2
  return `${Math.floor(total / 12)}′${halves(total % 12)}″`
}
