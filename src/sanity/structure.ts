import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'
import type { StructureResolver } from 'sanity/structure'
import { singletonId, SITES, type Site } from '../lib/sites'
import { apiVersion } from './env'

/** Each Studio workspace only shows its own site's documents. */
export const structureFor =
  (site: Site): StructureResolver =>
  (S, context) => {
    const { brand, division } = SITES[site]
    const list = (type: string, title: string) =>
      S.listItem()
        .title(title)
        .schemaType(type)
        .child(
          S.documentTypeList(type)
            .title(title)
            .apiVersion(apiVersion)
            .filter('_type == $type && division == $division')
            .params({ type, division })
            .initialValueTemplates([S.initialValueTemplateItem(`${type}-${site}`)]),
        )
    const singleton = (type: 'homePage' | 'siteSettings', title: string) =>
      S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(singletonId(type, site)).title(title))

    // The models in their order on the board, numbered, dragged into place; new ones are made in
    // this site's division (its own template) and go to the end.
    const models = orderableDocumentListDeskItem({
      type: 'talent',
      title: 'Models',
      id: `orderable-talent-${site}`,
      filter: 'division == $division',
      params: { division },
      createIntent: false,
      menuItems: [
        S.menuItem()
          .title('New model')
          .intent({ type: 'create', params: { type: 'talent', template: `talent-${site}` } })
          .showAsAction(true)
          .serialize(),
      ],
      S,
      context,
    })

    return S.list()
      .title(brand)
      .items([
        models,
        list('category', 'Categories'),
        S.divider(),
        list('application', 'Applications'),
        list('selection', 'Shared selections'),
        S.divider(),
        singleton('homePage', 'Home page'),
        singleton('siteSettings', 'Contact & settings'),
      ])
  }
