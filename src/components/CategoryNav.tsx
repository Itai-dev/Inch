import Link from 'next/link'
import { sitePath, type Site } from '@/lib/sites'
import type { Category } from '@/sanity/lib/types'

export function CategoryNav({ site, categories, active }: { site: Site; categories: Category[]; active?: string }) {
  if (!categories.length) return null
  const cls = (on: boolean) => (on ? 'border-b border-fg' : 'text-muted hover:text-fg')
  return (
    <nav className="label flex flex-wrap gap-6">
      <Link href={sitePath(site, '/models')} className={cls(!active)}>All</Link>
      {categories.map((c) => (
        <Link key={c._id} href={sitePath(site, `/models/${c.slug}`)} className={cls(active === c.slug)}>
          {c.title}
        </Link>
      ))}
    </nav>
  )
}
