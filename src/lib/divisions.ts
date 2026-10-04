import type { Division } from '@/sanity/lib/types'

export const DIVISION_META: Record<Division, { label: string; brand: string; path: string }> = {
  women: { label: 'Women', brand: 'INCH”', path: '/women' },
  men: { label: 'Men', brand: 'DOT.', path: '/men' },
}

export const isDivision = (v: string): v is Division => v === 'women' || v === 'men'
