import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { SelectionProvider } from '@/components/selection/SelectionProvider'
import { SelectionTray } from '@/components/selection/SelectionTray'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SelectionProvider>
      <Header />
      <main className="min-h-dvh">{children}</main>
      <Footer />
      <SelectionTray />
    </SelectionProvider>
  )
}
