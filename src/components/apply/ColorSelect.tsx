'use client'

/**
 * Hair and eye colour as the device's own picker (the words agencies use on comp cards, so
 * scouts can filter by them), the chosen colour shown beside it. "Other" opens a text field.
 */
import { useId, useState } from 'react'

type Swatch = { name: string; color: string }

export const HAIR: Swatch[] = [
  { name: 'Blonde', color: '#e2c48d' },
  { name: 'Dark blonde', color: '#b8925a' },
  { name: 'Light brown', color: '#8a6240' },
  { name: 'Brown', color: '#5e3b24' },
  { name: 'Dark brown', color: '#3a2417' },
  { name: 'Black', color: '#141110' },
  { name: 'Red', color: '#a8432a' },
  { name: 'Auburn', color: '#7a2e1f' },
  { name: 'Grey', color: '#aaa8a3' },
]

export const EYES: Swatch[] = [
  { name: 'Blue', color: '#5f86b4' },
  { name: 'Grey', color: '#8b9298' },
  { name: 'Green', color: '#5d7a4e' },
  { name: 'Hazel', color: '#8a7341' },
  { name: 'Light brown', color: '#8b5a2b' },
  { name: 'Brown', color: '#5a3620' },
  { name: 'Dark brown', color: '#2e1d14' },
]

const OTHER = 'Other'
const narrow = { fontStretch: '80%' } as const

function Dot({ color, iris, size }: { color?: string; iris?: boolean; size: number }) {
  return (
    <span
      aria-hidden
      className={`block shrink-0 rounded-full ${color ? 'border border-fg/15' : 'border border-dashed border-fg/60'}`}
      style={{
        width: size,
        height: size,
        background: !color
          ? undefined
          : iris
            ? `radial-gradient(circle, #0a0a0a 0 24%, ${color} 26% 60%, color-mix(in srgb, ${color} 55%, #000) 72%)`
            : color,
      }}
    />
  )
}

export function ColorSelect({
  label,
  options,
  value,
  onChange,
  iris = false,
  inputClassName,
}: {
  label: string
  options: Swatch[]
  value: string
  onChange: (v: string) => void
  /** Draw the chosen colour as an iris (eye colour) rather than a flat dot. */
  iris?: boolean
  inputClassName: string
}) {
  const id = useId()
  const [other, setOther] = useState(!!value && !options.some((o) => o.name === value))
  const chosen = other ? OTHER : value
  const swatch = options.find((o) => o.name === chosen)
  return (
    <div className="relative flex min-w-0 flex-col gap-1.5">
      <label htmlFor={`${id}-select`} className="text-[12px] uppercase tracking-[0.04em]" style={narrow}>
        {label}
      </label>
      {/* The device's own picker (a wheel on a phone, as the sizes), the chosen colour beside it. */}
      <span className={`flex w-full items-center gap-3 border-b-2 pb-1.5 ${chosen ? 'border-fg' : 'border-line focus-within:border-fg'}`}>
        {chosen ? <Dot color={swatch?.color} iris={iris} size={20} /> : null}
        <span className="relative min-w-0 flex-1">
          <select
            id={`${id}-select`}
            value={chosen}
            onChange={(e) => {
              const name = e.target.value
              if (name === OTHER) {
                setOther(true)
                if (!other) onChange('')
              } else {
                setOther(false)
                onChange(name)
              }
            }}
            className={`w-full cursor-pointer appearance-none truncate rounded-none bg-transparent pr-5 text-[clamp(18px,1.5vw,22px)] font-semibold outline-none ${chosen ? '' : 'text-muted/40'}`}
          >
            <option value="" disabled>
              Choose
            </option>
            {options.map((o) => (
              <option key={o.name} value={o.name} className="text-fg">
                {o.name}
              </option>
            ))}
            <option value={OTHER} className="text-fg">
              Other…
            </option>
          </select>
          <svg viewBox="0 0 12 8" aria-hidden className="pointer-events-none absolute right-0 top-1/2 w-3 -translate-y-1/2">
            <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </span>
      </span>

      {other && (
        <input
          required
          autoFocus
          aria-label={`${label}, other`}
          placeholder="Describe it"
          className={`mt-2 ${inputClassName}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
