import type { StructureResolver } from 'sanity/structure'

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type))

export const structure: StructureResolver = (S) =>
  S.list()
    .title('INCH”')
    .items([
      S.listItem()
        .title('INCH” — Women')
        .child(
          S.list()
            .title('Women')
            .items([
              S.listItem().title('Talents').child(
                S.documentTypeList('talent').title('Women').filter('_type == "talent" && division == "women"'),
              ),
              S.listItem().title('Categories').child(
                S.documentTypeList('category').title('Categories').filter('_type == "category" && division == "women"'),
              ),
            ]),
        ),
      S.listItem()
        .title('DOT. — Men')
        .child(
          S.list()
            .title('Men')
            .items([
              S.listItem().title('Talents').child(
                S.documentTypeList('talent').title('Men').filter('_type == "talent" && division == "men"'),
              ),
              S.listItem().title('Categories').child(
                S.documentTypeList('category').title('Categories').filter('_type == "category" && division == "men"'),
              ),
            ]),
        ),
      S.divider(),
      S.documentTypeListItem('application').title('Applications'),
      S.documentTypeListItem('selection').title('Shared selections'),
      S.divider(),
      singleton(S, 'homePage', 'Home page'),
      singleton(S, 'siteSettings', 'Site settings'),
    ])
