'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { TalentCard } from '@/sanity/lib/types'

type SelectionCtx = {
  items: TalentCard[]
  has: (id: string) => boolean
  toggle: (t: TalentCard) => void
  remove: (id: string) => void
  clear: () => void
  open: boolean
  setOpen: (v: boolean) => void
}

const Ctx = createContext<SelectionCtx | null>(null)
const KEY = 'inch-selection-v1'

/** Selection lives in the viewer's browser until they share it. */
export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<TalentCard[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const has = useCallback((id: string) => items.some((i) => i._id === id), [items])
  const remove = useCallback((id: string) => setItems((p) => p.filter((i) => i._id !== id)), [])
  const toggle = useCallback(
    (t: TalentCard) =>
      setItems((p) => (p.some((i) => i._id === t._id) ? p.filter((i) => i._id !== t._id) : [...p, t])),
    [],
  )
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({ items, has, toggle, remove, clear, open, setOpen }),
    [items, has, toggle, remove, clear, open],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSelection() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSelection must be used inside SelectionProvider')
  return ctx
}
