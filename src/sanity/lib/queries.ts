import { defineQuery } from 'next-sanity'

const cardFields = `_id, name, "slug": slug.current, division, cover`

export const HOME_QUERY = defineQuery(`*[_type == "homePage"][0]{
  statement, dotStatement,
  "featured": featured[]->{ ${cardFields} }
}`)

export const CATEGORIES_BY_DIVISION_QUERY = defineQuery(
  `*[_type == "category" && division == $division] | order(order asc){ _id, title, "slug": slug.current, division }`,
)

export const TALENTS_BY_DIVISION_QUERY = defineQuery(
  `*[_type == "talent" && division == $division] | order(order asc, name asc){ ${cardFields} }`,
)

export const CATEGORY_QUERY = defineQuery(`*[_type == "category" && division == $division && slug.current == $category][0]{
  _id, title, "slug": slug.current, division,
  "talents": *[_type == "talent" && references(^._id)] | order(order asc, name asc){ ${cardFields} }
}`)

export const TALENT_QUERY = defineQuery(`*[_type == "talent" && slug.current == $slug][0]{
  ${cardFields}, portfolio, polaroids, measurements, bio, instagram,
  "categories": categories[]->{ title, "slug": slug.current }
}`)

export const TALENTS_BY_IDS_QUERY = defineQuery(
  `*[_type == "talent" && _id in $ids]{ ${cardFields} }`,
)

export const SELECTION_QUERY = defineQuery(`*[_type == "selection" && shareId == $shareId][0]{
  title, note, _createdAt,
  "talents": talents[]->{ ${cardFields}, measurements }
}`)

export const ALL_SLUGS_QUERY = defineQuery(`{
  "talents": *[_type == "talent" && defined(slug.current)]{ "slug": slug.current, _updatedAt },
  "categories": *[_type == "category" && defined(slug.current)]{ "slug": slug.current, division, _updatedAt }
}`)
