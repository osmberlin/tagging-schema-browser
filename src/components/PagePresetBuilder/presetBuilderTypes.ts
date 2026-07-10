export type PresetBuilderTranslations = {
  name: string
  terms: string[]
  aliases: string[]
}

export type PresetBuilderState = {
  name: string
  icon: string
  searchable: boolean
  tags: Record<string, string>
  geometry: string[]
  fields: string[]
  moreFields: string[]
  terms: string[]
  aliases: string[]
  addTags: Record<string, string>
  removeTags: Record<string, string>
  matchScore: string
  referenceKey: string
  referenceValue: string
  locationSetInclude: string[]
  locationSetExclude: string[]
  locationSetCrossReference: string
  relation: string
  relationCrossReference: string
}

export const PRESET_BUILDER_DEFAULTS: PresetBuilderState = {
  name: '',
  icon: '',
  searchable: true,
  tags: {},
  geometry: [],
  fields: [],
  moreFields: [],
  terms: [],
  aliases: [],
  addTags: {},
  removeTags: {},
  matchScore: '',
  referenceKey: '',
  referenceValue: '',
  locationSetInclude: [],
  locationSetExclude: [],
  locationSetCrossReference: '',
  relation: '',
  relationCrossReference: '',
}
