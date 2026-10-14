/**
 * Text that types itself in, a letter at a time (no fade), starting `at` ms after it mounts.
 * Screen readers get the whole text at once. With reduced motion it's simply there.
 * Chain several by starting each where the last ends (`typeEnd`).
 */
export const TYPE_MS = 14

export const typeEnd = (text: string, at = 0, ms = TYPE_MS) => at + Array.from(text).length * ms

export function TypeText({ text, at = 0, ms = TYPE_MS }: { text: string; at?: number; ms?: number }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {Array.from(text).map((c, i) => (
          <span key={i} className="type-char" style={{ '--at': `${at + i * ms}ms` } as React.CSSProperties}>
            {c}
          </span>
        ))}
      </span>
    </>
  )
}
