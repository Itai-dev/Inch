import type { Division } from '@/sanity/lib/types'

/**
 * Wordmark. The logo may still change — this is the ONLY place it is drawn.
 * When the final logo lands, drop SVGs into /public/brand/ and swap the markup here.
 */
export function Logo({
  division = 'women',
  className = '',
  as: Tag = 'span',
}: {
  division?: Division
  className?: string
  as?: 'span' | 'h1' | 'div'
}) {
  const word = division === 'men' ? 'DOT.' : 'INCH”'
  return (
    <Tag className={`wordmark ${className}`} aria-label={division === 'men' ? 'DOT.' : 'INCH'}>
      {word}
    </Tag>
  )
}
