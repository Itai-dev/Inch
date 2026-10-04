import Link from 'next/link'
import { SelectionCount } from './selection/SelectionCount'

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-bg/90 px-5 py-4 backdrop-blur md:px-10">
      <Link href="/" className="text-xl font-bold tracking-tight">
        INCH”
      </Link>
      <nav className="flex items-center gap-5 text-sm uppercase tracking-wide md:gap-8">
        <Link href="/women">Women</Link>
        <Link href="/men">DOT. Men</Link>
        <Link href="/apply" className="hidden md:inline">Become a model</Link>
        <Link href="/contact" className="hidden md:inline">Contact</Link>
        <SelectionCount />
      </nav>
    </header>
  )
}
