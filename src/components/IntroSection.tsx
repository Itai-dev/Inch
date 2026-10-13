import Image from 'next/image'
import { creditLine } from '@/lib/slides'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/types'

/** Home: paragraph with images below it, each credited. */
// Sanity returns null (not undefined) for empty fields.
export function IntroSection({ text, images }: { text?: string | null; images?: SanityImage[] | null }) {
  const imgs = (images ?? []).filter((i) => i?.asset)
  if (!text && !imgs.length) return null
  return (
    <section className="flex flex-col gap-12 px-gutter py-20">
      {text && <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed md:text-xl">{text}</p>}
      {imgs.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          {imgs.map((img, k) => {
            const credit = creditLine(img)
            return (
              <li key={img._key || k}>
                <figure>
                  <span className="relative block aspect-[3/4] bg-line">
                    <Image src={urlFor(img).width(1000).url()} alt={img.alt || ''} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover" />
                  </span>
                  {credit && <figcaption className="mt-2 text-[10px] uppercase tracking-wide text-muted">{credit}</figcaption>}
                </figure>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
