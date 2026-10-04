import Link from 'next/link'
import { Logo } from './brand/Logo'
import { QuoteMark, SquareDot } from './brand/Marks'
import { SelectionCount } from './selection/SelectionCount'

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-bg/90 px-5 py-4 backdrop-blur md:px-10">
      <Link href="/" aria-label="INCH” home">
        <Logo className="text-[28px]" />
      </Link>
      <nav className="label flex items-center gap-5 md:gap-8">
        <Link href="/women" className="flex items-center gap-2"><QuoteMark height={10} /> Women</Link>
        <Link href="/men" className="flex items-center gap-2"><SquareDot size={7} /> Men</Link>
        <Link href="/apply" className="hidden md:inline">Become a model</Link>
        <Link href="/contact" className="hidden md:inline">Contact</Link>
        <SelectionCount />
      </nav>
    </header>
  )
}
