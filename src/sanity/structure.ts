import type { StructureResolver } from 'sanity/structure'
import { singletonId, SITES, type Site } from '../lib/sites'

/** Each Studio workspace only shows its own site's documents. */
export const structureFor =
  (site: Site): StructureResolver =>
  (S) => {
    const { brand, division } = SITES[site]
    const list = (type: string, title: string) =>
      S.listItem()
        .title(title)
        .schemaType(type)
        .child(
          S.documentTypeList(type)
            .title(title)
            .filter('_type == $type && division == $division')
            .params({ type, division })
            .initialValueTemplates([S.initialValueTemplateItem(`${type}-${site}`)]),
        )
    const singleton = (type: 'homePage' | 'siteSettings', title: string) =>
      S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(singletonId(type, site)).title(title))

    return S.list()
      .title(brand)
      .items([
        list('talent', 'Models'),
        list('category', 'Categories'),
        S.divider(),
        list('application', 'Applications'),
        list('selection', 'Shared selections'),
        S.divider(),
        singleton('homePage', 'Home page'),
        singleton('siteSettings', 'Site settings'),
      ])
  }
