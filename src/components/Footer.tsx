import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-24 flex flex-col gap-4 border-t border-line px-5 py-10 text-sm text-muted md:flex-row md:justify-between md:px-10">
      <p>© {new Date().getFullYear()} INCH” Model Management</p>
      <nav className="flex gap-6">
        <Link href="/apply">Become a model</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/accessibility">Accessibility</Link>
      </nav>
    </footer>
  )
}
