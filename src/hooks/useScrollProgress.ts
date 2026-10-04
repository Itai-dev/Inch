'use client'

import { useEffect, useRef, useState } from 'react'

/** 0→1 progress of a tall "scroll zone" element passing the viewport. */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const total = el.offsetHeight - window.innerHeight
      if (total <= 0) return
      setProgress(Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total)))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return { ref, progress }
}
