import Link from 'next/link'
import { Logo } from './brand/Logo'
import { Pattern } from './brand/Pattern'

export function Footer() {
  return (
    <footer className="mt-24 flex flex-col gap-12 px-5 pb-10 pt-16 md:px-10">
      <Pattern className="hidden text-fg md:grid" rows={2} cols={16} />
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-end gap-8">
          <Logo className="text-5xl" />
          <Logo division="men" className="text-5xl" />
        </div>
        <nav className="label flex flex-wrap gap-6 text-muted">
          <Link href="/apply">Become a model</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/accessibility">Accessibility</Link>
          <span>© {new Date().getFullYear()} INCH” Model Management</span>
        </nav>
      </div>
    </footer>
  )
}
