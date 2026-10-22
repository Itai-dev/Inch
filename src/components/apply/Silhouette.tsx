/** Thin outline drawings for the photo slots: what each digital should show. */
export type Pose = 'portrait' | 'medium' | 'full-body' | 'profile'

const PATHS: Record<Pose, string> = {
  // Head and shoulders, straight on.
  portrait:
    'M45 22c-11 0-18 9-18 22 0 10 4 19 10 24v8c-12 3-24 8-28 14M45 22c11 0 18 9 18 22 0 10-4 19-10 24v8c12 3 24 8 28 14M37 76c3 3 13 3 16 0',
  // Head turned to the side.
  profile:
    'M50 22c-12 0-19 9-19 21 0 6 2 10 2 13l-4 7 5 2-1 5c0 4 4 6 9 5l2 10c-10 3-20 8-25 15M50 22c9 0 15 7 15 17 0 9-4 16-9 20l-1 15c8 3 16 8 20 16',
  // Whole figure, standing.
  'full-body':
    'M45 10c-5 0-8 4-8 9s3 10 8 10 8-5 8-10-3-9-8-9ZM39 31c-7 2-11 5-12 11l-3 26M51 31c7 2 11 5 12 11l3 26M36 40v28l2 44M54 40v28l-2 44M45 70v42',
  // Head to the waist, straight on.
  medium:
    'M45 14c-7 0-11 6-11 13s4 14 11 14 11-7 11-14-4-13-11-13ZM39 41v6c-11 3-19 7-21 15l-3 50M51 41v6c11 3 19 7 21 15l3 50M28 66v46M62 66v46',
}

export function Silhouette({ pose, className = '' }: { pose: Pose; className?: string }) {
  return (
    <svg viewBox="0 0 90 120" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[pose]} />
    </svg>
  )
}
