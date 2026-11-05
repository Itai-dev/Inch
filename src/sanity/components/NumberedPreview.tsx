'use client'

/**
 * A model's row in the Studio, numbered by her place on the board (01, 02, …), the same order as
 * the site's (the order dragged in the list). One shared, live list a division: when a model is
 * dragged elsewhere every row's number follows.
 */
import { useSyncExternalStore } from 'react'
import { useClient, type PreviewProps, type SanityClient } from 'sanity'
import { apiVersion } from '../env'

type Store = { ids: string[]; subs: Set<() => void>; stop?: () => void }
const stores = new Map<string, Store>()

const ORDER = `*[_type == "talent" && division == $division && !(_id in path("drafts.**"))] | order(coalesce(orderRank, "0") asc, name asc)._id`

function storeFor(client: SanityClient, division: string) {
  let s = stores.get(division)
  if (s) return s
  s = { ids: [], subs: new Set() }
  stores.set(division, s)
  const store = s
  const load = () =>
    client.fetch<string[]>(ORDER, { division }).then((ids) => {
      store.ids = ids
      store.subs.forEach((f) => f())
    })
  load()
  let t = 0
  const sub = client.listen('*[_type == "talent"]', {}, { visibility: 'query', events: ['mutation'] }).subscribe(() => {
    clearTimeout(t)
    t = window.setTimeout(load, 250)
  })
  store.stop = () => sub.unsubscribe()
  return store
}

export function NumberedPreview(props: PreviewProps) {
  // The row's id and division come through the description (see the schema's preview).
  const meta = typeof props.description === 'string' ? props.description : ''
  const [rawId, division] = meta.split('|')
  const id = rawId?.replace(/^drafts\./, '')
  const client = useClient({ apiVersion })
  const store = division ? storeFor(client, division) : null
  const ids = useSyncExternalStore(
    (f) => {
      store?.subs.add(f)
      return () => store?.subs.delete(f)
    },
    () => store?.ids ?? [],
    () => [],
  )
  const n = id ? ids.indexOf(id) + 1 : 0
  const title = n > 0 ? `${String(n).padStart(2, '0')}   ${String(props.title ?? '')}` : props.title
  return props.renderDefault({ ...props, title, description: undefined })
}
