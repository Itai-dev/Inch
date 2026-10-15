'use client'

/**
 * Light or dark, for the model page: a sun and a moon (Google's Material Symbols), the sun's
 * button always light and the moon's always dark, the chosen one at full strength. The choice is
 * remembered on this device; until then the page follows its site (INCH” light, DOT. dark).
 */
import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'inch:sheet-theme'
const listeners = new Set<() => void>()

function read(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}
function write(v: Theme) {
  try {
    localStorage.setItem(KEY, v)
  } catch {}
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** The chosen theme, else `fallback`; and a way to choose. */
export function useTheme(fallback: Theme): [Theme, (t: Theme) => void] {
  const chosen = useSyncExternalStore(subscribe, read, () => null)
  return [chosen ?? fallback, write]
}

/** Material Symbols: light_mode, dark_mode (Apache 2.0). */
const ICONS: Record<Theme, string> = {
  light:
    'M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z',
  dark: 'M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z',
}

export function ThemeToggle({ theme, onChange, className = '' }: { theme: Theme; onChange: (t: Theme) => void; className?: string }) {
  return (
    <div role="radiogroup" aria-label="Light or dark" className={`flex border border-fg/30 ${className}`}>
      {(['light', 'dark'] as Theme[]).map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={theme === t}
          aria-label={t === 'light' ? 'Light' : 'Dark'}
          onClick={() => onChange(t)}
          className={`grid size-8 place-items-center transition-opacity duration-300 ${t === 'light' ? 'bg-paper text-ink' : 'bg-ink text-paper'} ${theme === t ? '' : 'opacity-40 hover:opacity-75'}`}
        >
          <svg viewBox="0 -960 960 960" className="size-[18px]" fill="currentColor" aria-hidden>
            <path d={ICONS[t]} />
          </svg>
        </button>
      ))}
    </div>
  )
}
