'use client'

/**
 * Hair and eye colour as a dropdown: each name with its colour beside it (the words
 * agencies use on comp cards, so scouts can filter by them). "Other" opens a text field.
 * A listbox underneath: arrow keys, Enter and Esc work as in a native select.
 */
import { useEffect, useId, useRef, useState } from 'react'

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
  /** Draw each colour as an iris (eye colour) rather than a flat dot. */
  iris?: boolean
  inputClassName: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [other, setOther] = useState(!!value && !options.some((o) => o.name === value))
  const all = [...options.map((o) => o.name), OTHER]
  const chosen = other ? OTHER : value
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', away)
    list.current?.focus()
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const show = () => {
    setActive(Math.max(0, all.indexOf(chosen)))
    setOpen(true)
  }
  const pick = (name: string) => {
    setOpen(false)
    button.current?.focus()
    if (name === OTHER) {
      setOther(true)
      if (!other) onChange('')
    } else {
      setOther(false)
      onChange(name)
    }
  }

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(all[active])
    } else if (e.key === 'Escape') {
      // Close the list, not the whole application.
      e.stopPropagation()
      setOpen(false)
      button.current?.focus()
    } else if (e.key === 'Tab') setOpen(false)
  }

  const swatch = options.find((o) => o.name === chosen)
  return (
    <div ref={root} className="relative flex min-w-0 flex-col gap-1.5">
      <span id={`${id}-label`} className="text-[12px] font-bold uppercase tracking-[0.04em]" style={narrow}>
        {label}
      </span>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            show()
          }
        }}
        className={`flex w-full items-center gap-3 border-b-2 pb-1.5 text-left text-[clamp(20px,1.8vw,26px)] font-semibold outline-none ${chosen ? 'border-fg' : 'border-line focus-visible:border-fg'}`}
      >
        {chosen ? <Dot color={swatch?.color} iris={iris} size={22} /> : null}
        <span id={`${id}-value`} className={`min-w-0 flex-1 truncate ${chosen ? '' : 'text-muted/40'}`}>
          {chosen || 'Choose'}
        </span>
        <svg viewBox="0 0 12 8" aria-hidden className={`w-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {open && (
        <ul
          ref={list}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKey}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-[316px] overflow-y-auto border-2 border-fg bg-bg py-1 outline-none"
        >
          {all.map((name, i) => {
            const o = options.find((x) => x.name === name)
            return (
              <li
                key={name}
                id={`${id}-${i}`}
                role="option"
                aria-selected={name === chosen}
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(name)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-[14px] font-bold uppercase ${i === active ? 'bg-surface' : ''}`}
                style={narrow}
              >
                <Dot color={o?.color} iris={iris} size={20} />
                <span className="flex-1">{name === OTHER ? 'Other…' : name}</span>
                {name === chosen && <span aria-hidden>✓</span>}
              </li>
            )
          })}
        </ul>
      )}

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
