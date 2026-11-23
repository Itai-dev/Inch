'use client'

import { useCallback } from 'react'
import { PatchEvent, type FormPatch, type SlugInputProps } from 'sanity'

/** "Sun Mizrahi" → "sun-mizrahi": lowercase, spaces to dashes, nothing else but letters, numbers and dashes. */
export const cleanSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-/, '')

/** The slug field, tidied as it is typed or pasted, so it can't be saved in a form the site's address can't use. */
export function CleanSlugInput(props: SlugInputProps) {
  const { onChange } = props
  const tidy = useCallback(
    (arg: FormPatch | FormPatch[] | PatchEvent) => {
      const patches = arg instanceof PatchEvent ? arg.patches : Array.isArray(arg) ? arg : [arg]
      onChange(
        PatchEvent.from(
          patches.map((p) =>
            p.type === 'set' && typeof p.value === 'string' && p.path.length === 1 && p.path[0] === 'current' ? { ...p, value: cleanSlug(p.value) } : p,
          ),
        ),
      )
    },
    [onChange],
  )
  return props.renderDefault({ ...props, onChange: tidy })
}
