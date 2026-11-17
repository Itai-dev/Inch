import { defineQuery } from 'next-sanity'

const cardFields = `_id, name, "slug": slug.current, division, cover`

export const HOME_QUERY = defineQuery(`*[_id == $id][0]{
  "heroVideos": heroVideos[]{ _type, "src": video.asset->url, poster, asset, hotspot, crop },
  "heroVideo": heroVideo.asset->url, heroPoster, statement, intro, introImages, story[]{ _key, heading, text, images },
  magazine{ cover, heading, text, pages[]{ _type, _key, image, name } }
}`)

/** Contact details, from the site's Contact page (`contactPage-…`; older ones from Site settings until it has them). `$id` is the site's Site settings id. */
const CONTACT = `{ "c": *[_id == "contactPage-" + string::split($id, "-")[1]][0], "s": *[_id == $id][0] }`
export const SITE_SETTINGS_QUERY = defineQuery(
  `${CONTACT}{ "email": coalesce(c.email, s.email), "phone": coalesce(c.phone, s.phone), "address": coalesce(c.address, s.address), "instagram": coalesce(c.instagram, s.instagram), "hours": c.hours, "prints": c.prints }`,
)

export const APPLY_SETTINGS_QUERY = defineQuery(`${CONTACT}{ "email": coalesce(c.email, s.email), "thanks": s.thanks }`)

export const CATEGORIES_BY_DIVISION_QUERY = defineQuery(
  `*[_type == "category" && division == $division] | order(order asc){ _id, title, "slug": slug.current, division }`,
)

export const TALENTS_BY_DIVISION_QUERY = defineQuery(
  `*[_type == "talent" && division == $division && !coalesce(hidden, false)] | order(coalesce(orderRank, "0") asc, name asc){ ${cardFields}, "pics": portfolio[0...6] }`,
)

export const CATEGORY_QUERY = defineQuery(`*[_type == "category" && division == $division && slug.current == $category][0]{
  _id, title, "slug": slug.current, division,
  // The category's own list, in its order; else (older categories) the models that name it.
  "talents": select(
    count(models) > 0 => models[@->division == $division && !coalesce(@->hidden, false)]->{ ${cardFields} },
    *[_type == "talent" && division == $division && references(^._id) && !coalesce(hidden, false)] | order(coalesce(orderRank, "0") asc, name asc){ ${cardFields} }
  )
}`)

/** A model, on her own site only: `$division` is the site's, so INCH” never serves a DOT. model (or the other way round). */
export const TALENT_QUERY = defineQuery(`*[_type == "talent" && division == $division && slug.current == $slug && !coalesce(hidden, false)][0]{
  ${cardFields}, portfolio, polaroids, measurements, bio, instagram,
  "categories": *[_type == "category" && division == $division && (^._id in models[]._ref || _id in ^.categories[]._ref)]{ title, "slug": slug.current }
}`)

/** Whole talents by id, for comp cards of a selection: this site's models only. */
export const TALENTS_FULL_BY_IDS_QUERY = defineQuery(`*[_type == "talent" && division == $division && _id in $ids && !coalesce(hidden, false)]{
  ${cardFields}, portfolio, polaroids, measurements
}`)

/** Of these ids, the ones that are this site's models (a selection never holds the other site's). */
export const TALENT_IDS_OF_DIVISION_QUERY = defineQuery(`*[_type == "talent" && division == $division && _id in $ids]._id`)

export const SELECTION_QUERY = defineQuery(`*[_type == "selection" && shareId == $shareId][0]{
  title, note, division, _createdAt,
  "talents": talents[@->division == coalesce(^.division, "women") && !coalesce(@->hidden, false)]->{ ${cardFields}, measurements }
}`)

export const ALL_SLUGS_QUERY = defineQuery(`{
  "talents": *[_type == "talent" && division in ["women", "men"] && defined(slug.current) && !coalesce(hidden, false)]{ "slug": slug.current, division, _updatedAt },
  "categories": *[_type == "category" && division in ["women", "men"] && defined(slug.current)]{ "slug": slug.current, division, _updatedAt }
}`)
