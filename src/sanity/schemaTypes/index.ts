import type { SchemaTypeDefinition } from 'sanity'
import { application } from './application'
import { category } from './category'
import { contactPage } from './contactPage'
import { homePage } from './homePage'
import { measurements } from './objects/measurements'
import { selection } from './selection'
import { siteSettings } from './siteSettings'
import { talent } from './talent'

export const schemaTypes: SchemaTypeDefinition[] = [
  talent,
  category,
  homePage,
  contactPage,
  siteSettings,
  selection,
  application,
  measurements,
]
