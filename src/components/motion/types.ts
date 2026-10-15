export type Slide = {
  id: string
  src: string
  alt: string
  href?: string
  caption?: string
  /** Wider than tall: gets a whole spread to itself in the model book. */
  landscape?: boolean
}
