import type { References } from '@/schemaRuntimeDereference'

export type RawPresets = Record<string, RawPreset>
export type RawPreset = {
  icon?: string
  /** Remote bitmap (or any image URL); shown in the preview like iD when third-party images are enabled. */
  imageURL?: string
  fields?: string[]
  moreFields?: string[]
  geometry?: string[]
  tags?: Record<string, string>
  matchScore?: number
  searchable?: boolean
  suggestion?: boolean
}

export type RawFieldTranslation = {
  label?: string
  placeholder?: string
  terms?: string
  options?: Record<string, string>
}

export type RawTranslations = {
  en?: {
    presets?: {
      presets?: Record<string, { name?: string; terms?: string; aliases?: string }>
      categories?: Record<string, { name?: string }>
      fields?: Record<string, RawFieldTranslation>
    }
  }
}

export type RawCategories = Record<string, { icon?: string; members?: string[] }>

export type RawField = {
  key?: string
  type?: string
  geometry?: string[]
  label?: string
  placeholder?: string
  universal?: boolean
  terms?: string[]
  options?: string[]
  icons?: Record<string, string>
  iconsCrossReference?: string
  /** v6 only — removed from v7 dist after schema-builder dereferences at build time. */
  stringsCrossReference?: string
}

export type RawFields = Record<string, RawField>

export type FieldTranslations = Record<string, RawFieldTranslation>

export type DenormalizedPreset = {
  id: string
  name: string
  terms: string[]
  aliases: string[]
  icon?: string
  imageURL?: string
  iconPrefix?: string
  geometry: string[]
  tags: Record<string, string>
  tagString: string
  primaryTagKey?: string
  primaryTagValue?: string
  categoryIds: string[]
  categoryNames: string[]
  fields: string[]
  moreFields: string[]
  matchScore: number
  hasIcon: boolean
  /** Preset has an `icon` field but no matching asset in the icon library. */
  iconBroken: boolean
  searchable?: boolean
}

export type SchemaData = {
  presets: DenormalizedPreset[]
  presetsById: Map<string, DenormalizedPreset>
  /** Source preset entries as authored in `data/presets/{id}.json`. */
  rawPresets: RawPresets
  categories: RawCategories
  categoryNames: Record<string, string>
  /** Raw field definitions (keyed by field id) — used to expand a preset's field references. */
  fields: RawFields
  translations: RawTranslations
  /** English field labels and option strings from translations/en.min.json. */
  fieldTranslations: FieldTranslations
  /** Reference map for runtime locale dereferencing; null when v7 dist or no refs. */
  schemaReferences: References | null
  loadError: string | null
  diagnostics: string[]
}

export type IconRegistryEntry = {
  name: string
  prefix: string
  svgRaw?: string
}

export type OptionIconUsageRef = {
  fieldId: string
  fieldKey: string
  optionValue: string
}

export type IconViewModel = IconRegistryEntry & {
  presetUsageCount: number
  optionUsageCount: number
  /** Total references (presets + option entries) — used for sorting. */
  usageCount: number
  presets: DenormalizedPreset[]
  optionUsages: OptionIconUsageRef[]
}

export type FieldViewModel = {
  id: string
  key: string
  type: string
  label: string
  geometry: string[]
  universal: boolean
  usageCount: number
  primaryCount: number
  moreCount: number
  presets: DenormalizedPreset[]
}
