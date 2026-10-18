'use client'

/**
 * Country as a searchable dropdown: type to narrow the list (names starting with what you typed
 * come first), then pick with the mouse, or the arrow keys and Enter. Only a country from the
 * list counts; anything else asks to choose one.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react'

// ISO 3166-1 alpha-2 codes; the names come from the browser, in English.
const CODES =
  'AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(' ')

let names: string[] | null = null
function countries() {
  if (names) return names
  let dn: Intl.DisplayNames | null = null
  try {
    dn = new Intl.DisplayNames(['en'], { type: 'region' })
  } catch {}
  names = [...new Set(CODES.map((c) => dn?.of(c) || c))].sort((a, b) => a.localeCompare(b))
  return names
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const narrow = { fontStretch: '80%' } as const

export function CountrySelect({ label, value, onChange, inputClassName }: { label: string; value: string; onChange: (v: string) => void; inputClassName: string }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const all = countries()
  const shown = useMemo(() => {
    const q = fold(query)
    if (!q || query === value) return all
    const starts = all.filter((n) => fold(n).startsWith(q))
    const has = all.filter((n) => !fold(n).startsWith(q) && fold(n).includes(q))
    return [...starts, ...has]
  }, [all, query, value])

  // Only a country from the list counts.
  useEffect(() => {
    input.current?.setCustomValidity(query && query !== value ? 'Choose a country from the list.' : '')
  }, [query, value])

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  /** Closing keeps a typed name that matches a country exactly, else goes back to the chosen one. */
  const close = () => {
    setOpen(false)
    const exact = all.find((n) => fold(n) === fold(query))
    if (exact) {
      setQuery(exact)
      onChange(exact)
    } else if (!query) onChange('')
    else setQuery(value)
  }
  // A click outside closes the list.
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && close()
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  })

  const pick = (name: string) => {
    setQuery(name)
    onChange(name)
    setOpen(false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      const n = Math.max(1, shown.length)
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + n) % n)
    } else if (e.key === 'Enter' && open) {
      e.preventDefault()
      if (shown[active]) pick(shown[active])
    } else if (e.key === 'Escape' && open) {
      // Close the list, not the whole application.
      e.stopPropagation()
      close()
    } else if (e.key === 'Tab' && open) close()
  }

  return (
    <div ref={root} className="relative flex min-w-0 flex-col gap-2">
      <label htmlFor={`${id}-input`} className="text-[13px] uppercase tracking-[0.04em]" style={narrow}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={input}
          id={`${id}-input`}
          required
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${id}-${active}` : undefined}
          autoComplete="off"
          placeholder="Start typing"
          className={`${inputClassName} pr-6`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setActive(Math.max(0, all.indexOf(value)))}
          onClick={() => setOpen(true)}
          onKeyDown={onKey}
        />
        <svg viewBox="0 0 12 8" aria-hidden className={`pointer-events-none absolute right-0 top-1/2 w-3 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {open && (
        <ul ref={list} id={`${id}-list`} role="listbox" aria-label={label} className="absolute inset-x-0 top-full z-20 mt-1 max-h-[316px] overflow-y-auto border-2 border-fg bg-bg py-1">
          {shown.length ? (
            shown.map((name, i) => (
              <li
                key={name}
                id={`${id}-${i}`}
                role="option"
                aria-selected={name === value}
                onPointerEnter={() => setActive(i)}
                // Pick before the input loses focus.
                onPointerDown={(e) => {
                  e.preventDefault()
                  pick(name)
                }}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-[14px] font-bold uppercase ${i === active ? 'bg-surface' : ''}`}
                style={narrow}
              >
                <span className="flex-1">{name}</span>
                {name === value && <span aria-hidden>✓</span>}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-[14px] text-muted">No country called “{query}”</li>
          )}
        </ul>
      )}
    </div>
  )
}
