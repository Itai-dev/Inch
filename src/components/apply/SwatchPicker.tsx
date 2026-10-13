'use client'

/**
 * Hair and eye colour as named swatches (the words agencies use on comp cards), so every
 * application reads the same and scouts can filter by them. "Other" opens a text field.
 * A radio group underneath: keyboard and screen readers work as with any radios.
 */
import { useState } from 'react'

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

const OTHER = '__other'

export function SwatchPicker({
  label,
  name,
  options,
  value,
  onChange,
  iris = false,
  inputClassName,
}: {
  label: string
  name: string
  options: Swatch[]
  value: string
  onChange: (v: string) => void
  /** Draw each swatch as an iris (eye colour) rather than a flat colour. */
  iris?: boolean
  inputClassName: string
}) {
  const [other, setOther] = useState(!!value && !options.some((o) => o.name === value))
  const ring = 'ring-offset-2 ring-offset-bg peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:ring-2 peer-focus-visible:ring-fg/60'
  const tag = 'text-center text-[11px] font-bold uppercase leading-tight'

  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-3 text-[12px] font-bold uppercase tracking-[0.04em]" style={{ fontStretch: '80%' }}>
        {label}
      </legend>
      <div className="flex flex-wrap gap-x-1.5 gap-y-3">
        {options.map((o) => (
          <label key={o.name} className="flex w-[58px] cursor-pointer flex-col items-center gap-1.5">
            <input
              type="radio"
              name={name}
              required
              className="peer sr-only"
              checked={!other && value === o.name}
              onChange={() => {
                setOther(false)
                onChange(o.name)
              }}
            />
            <span
              aria-hidden
              className={`block size-9 rounded-full border border-fg/15 transition-shadow ${ring}`}
              style={{
                background: iris
                  ? `radial-gradient(circle, #0a0a0a 0 24%, ${o.color} 26% 60%, color-mix(in srgb, ${o.color} 55%, #000) 72%)`
                  : o.color,
              }}
            />
            <span className={tag} style={{ fontStretch: '80%' }}>{o.name}</span>
          </label>
        ))}
        <label className="flex w-[58px] cursor-pointer flex-col items-center gap-1.5">
          <input
            type="radio"
            name={name}
            value={OTHER}
            required
            className="peer sr-only"
            checked={other}
            onChange={() => {
              setOther(true)
              onChange('')
            }}
          />
          <span aria-hidden className={`grid size-9 place-items-center rounded-full border border-dashed border-fg/60 text-[18px] leading-none ${ring}`}>+</span>
          <span className={tag} style={{ fontStretch: '80%' }}>Other</span>
        </label>
      </div>
      {other && (
        <input
          required
          autoFocus
          aria-label={`${label}, other`}
          placeholder="Describe it"
          className={`max-w-[320px] ${inputClassName}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </fieldset>
  )
}
