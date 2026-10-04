import type { Metadata } from 'next'
import { BlinkOpen } from '@/components/motion/BlinkOpen'
import { DotIndexCarousel } from '@/components/motion/DotIndexCarousel'
import { DotOpen } from '@/components/motion/DotOpen'
import { DotStatement } from '@/components/motion/DotStatement'
import { TapeCarousel } from '@/components/motion/TapeCarousel'
import { TextOpen } from '@/components/motion/TextOpen'
import { DEFAULT_DOT_STATEMENT, DEFAULT_STATEMENT } from '@/lib/copy'
import { placeholderSlides } from '@/lib/slides'

export const metadata: Metadata = { title: 'Motion lab', robots: { index: false, follow: false } }

const slides = placeholderSlides()

function Label({ n, title, note }: { n: string; title: string; note: string }) {
  return (
    <header className="flex flex-col gap-2 px-5 pt-24 md:px-10">
      <p className="label text-muted">{n}</p>
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="max-w-xl text-muted">{note}</p>
    </header>
  )
}

/** Review page for all brand motions with placeholder imagery. */
export default function MotionLab() {
  return (
    <div>
      <section className="bg-paper text-ink">
        <Label n="INCH” · 01" title="Text open" note="Scroll. The ” splits; the right stroke travels with the reveal." />
        <TextOpen text={DEFAULT_STATEMENT} />
        <Label n="INCH” · 02" title="Tape-measure carousel" note="Drag the ruler, scroll, click a number, hold, or use ← →." />
        <TapeCarousel slides={slides} height="90dvh" />
        <Label n="INCH” · 03" title="Blink and open" note="Plays when in view." />
        <div className="mx-auto max-w-xl px-5 py-16"><BlinkOpen src={slides[0].src} alt="Placeholder" /></div>
      </section>

      <section data-theme="dot" className="bg-bg text-fg">
        <Label n="DOT. · 01" title="Word-step statement" note="Scroll. A ■ cursor jumps word by word and lands as the full stop." />
        <DotStatement text={DEFAULT_DOT_STATEMENT} />
        <Label n="DOT. · 02" title="Square-index carousel" note="One image at a time, ■ aperture wipe. Squares, arrows, drag or scroll." />
        <DotIndexCarousel slides={slides} height="80dvh" />
        <Label n="DOT. · 03" title="Square aperture open" note="■ pulses twice, then opens into the image." />
        <div className="mx-auto max-w-md px-5 py-16"><DotOpen src={slides[3].src} alt="Placeholder" /></div>
      </section>
    </div>
  )
}
