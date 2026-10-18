/**
 * The pointer for things you pick up and move (the magazine's pages, the contact prints): a large
 * open hand that closes while it holds something, drawn so it stays sharp at any size.
 */
export const HAND_PX = 46
const HAND_PATHS = {
  open: [
    'M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2',
    'M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2',
    'M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8',
    'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
  ],
  held: [
    'M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4',
    'M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2',
    'M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5',
    'M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2',
    'M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0',
  ],
}

export function HandIcon({ kind }: { kind: keyof typeof HAND_PATHS }) {
  return (
    <svg viewBox="0 0 24 24" width={HAND_PX} height={HAND_PX} fill="none" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 overflow-visible">
      {/* A white edge under the black line, so it reads on the pictures and on the paper. */}
      {HAND_PATHS[kind].map((d) => (
        <path key={`w${d}`} d={d} stroke="#fff" strokeWidth={4.2} />
      ))}
      {HAND_PATHS[kind].map((d) => (
        <path key={d} d={d} stroke="#0a0a0a" strokeWidth={1.7} />
      ))}
    </svg>
  )
}
