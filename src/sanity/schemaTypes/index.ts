import type { SchemaTypeDefinition } from 'sanity'
import { application } from './application'
import { category } from './category'
import { homePage } from './homePage'
import { measurements } from './objects/measurements'
import { selection } from './selection'
import { siteSettings } from './siteSettings'
import { talent } from './talent'

export const schemaTypes: SchemaTypeDefinition[] = [
  talent,
  category,
  homePage,
  siteSettings,
  selection,
  application,
  measurements,
]
