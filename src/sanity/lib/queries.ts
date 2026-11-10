import { defineQuery } from 'next-sanity'

const cardFields = `_id, name, "slug": slug.current, division, cover`

export const HOME_QUERY = defineQuery(`*[_id == $id][0]{
  "heroVideos": heroVideos[]{ _type, "src": video.asset->url, poster, asset, hotspot, crop },
  "heroVideo": heroVideo.asset->url, heroPoster, statement,
  "magazine": magazine{
    heading, text, cover,
    // A page is a model (her cover and name) or a picture with its own caption.
    "pages": pages[]{ _key, ...select(_type == "reference" => @->{ name, "image": cover }, { name, image }) }
  }
}`)

const contactFields = `email, phone, address, instagram, hours`

/** A site's settings, with INCH”'s contact details beside them (DOT. uses those where its own are empty). */
export const SITE_SETTINGS_QUERY = defineQuery(`{
  "own": *[_id == $id][0]{ ${contactFields}, title, description, ogImage, contactImages, thanks },
  "main": *[_id == $main][0]{ ${contactFields} }
}`)

export const CATEGORIES_BY_DIVISION_QUERY = defineQuery(
  `*[_type == "category" && division == $division] | order(order asc){ _id, title, "slug": slug.current, division }`,
)

export const TALENTS_BY_DIVISION_QUERY = defineQuery(
  `*[_type == "talent" && division == $division] | order(coalesce(orderRank, "0") asc, name asc){ ${cardFields}, "pics": portfolio[0...6] }`,
)

export const CATEGORY_QUERY = defineQuery(`*[_type == "category" && division == $division && slug.current == $category][0]{
  _id, title, "slug": slug.current, division,
  "talents": *[_type == "talent" && references(^._id)] | order(coalesce(orderRank, "0") asc, name asc){ ${cardFields} }
}`)

export const TALENT_QUERY = defineQuery(`*[_type == "talent" && slug.current == $slug][0]{
  ${cardFields}, portfolio, polaroids, measurements, bio, instagram,
  "categories": categories[]->{ title, "slug": slug.current }
}`)

/** Whole talents by id, for comp cards of a selection. */
export const TALENTS_FULL_BY_IDS_QUERY = defineQuery(`*[_type == "talent" && _id in $ids]{
  ${cardFields}, portfolio, polaroids, measurements
}`)

export const TALENTS_BY_IDS_QUERY = defineQuery(
  `*[_type == "talent" && _id in $ids]{ ${cardFields} }`,
)

export const SELECTION_QUERY = defineQuery(`*[_type == "selection" && shareId == $shareId][0]{
  title, note, division, _createdAt,
  "talents": talents[]->{ ${cardFields}, measurements }
}`)

export const ALL_SLUGS_QUERY = defineQuery(`{
  "talents": *[_type == "talent" && defined(slug.current)]{ "slug": slug.current, division, _updatedAt },
  "categories": *[_type == "category" && defined(slug.current)]{ "slug": slug.current, division, _updatedAt }
}`)
