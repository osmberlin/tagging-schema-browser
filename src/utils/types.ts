import type {
  MissingFieldInheritance,
  MissingInheritanceStatus,
} from '@/components/PagePresets/missingFieldInheritance'
import type { RiskyTypeCombo, RiskyTypeComboStatus } from '@/components/PagePresets/riskyTypeCombo'
import type { FieldOptionTranslation } from '@/utils/fieldOptionTranslation'
import type { PresetIconMismatchRef, PresetIconMismatchRow } from '@/utils/iconMismatch'
import type { PrerequisiteTag } from '@/utils/prerequisiteTag'
import type { SchemaBuildInfo } from '@/utils/schemaBuildVersion'

export type { PresetIconMismatchRef, PresetIconMismatchRow } from '@/utils/iconMismatch'

export type RawPresets = Record<string, RawPreset>
export type RawPreset = {
  icon?: string
  /** Remote bitmap (or any image URL); shown in the preview like iD when third-party images are enabled. */
  imageURL?: string
  fields?: string[]
  moreFields?: string[]
  geometry?: string[]
  tags?: Record<string, string>
  /** Tags applied when selecting this preset. Defaults to `tags`. */
  addTags?: Record<string, string>
  /** Tags removed when deselecting this preset. Defaults to `addTags`, then `tags`. */
  removeTags?: Record<string, string>
  matchScore?: number
  searchable?: boolean
  suggestion?: boolean
}

export type RawFieldTranslation = {
  label?: string
  placeholder?: string
  terms?: string | string[]
  options?: Record<string, FieldOptionTranslation>
}

export type RawTranslations = {
  en?: {
    presets?: {
      presets?: Record<
        string,
        { name?: string; terms?: string | string[]; aliases?: string | string[] }
      >
      categories?: Record<string, { name?: string }>
      fields?: Record<string, RawFieldTranslation>
    }
  }
}

export type RawCategories = Record<string, { icon?: string; members?: string[] }>

export type RawField = {
  key?: string
  /** Some fields (access, structure, directional) control multiple tag keys. */
  keys?: string[]
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
  prerequisiteTag?: PrerequisiteTag
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
  /** Preset icon disagrees with a linked field option icon (parent or child). */
  iconMismatch: boolean
  /** Slash-parent field lists omitted deliberately on an explicit `fields` / `moreFields` array. */
  missingFieldInheritance: MissingFieldInheritance | null
  missingInheritanceStatus: MissingInheritanceStatus
  /** typeCombo fields that can write `=yes` on presets with fixed tags. */
  riskyTypeCombo: RiskyTypeCombo | null
  riskyTypeComboStatus: RiskyTypeComboStatus
  searchable?: boolean
  /** Authored under `data/presets/@templates/` or tagged with `@template`. */
  isTemplate: boolean
}

export type FieldOptionMismatchRow = {
  optionValue: string
  optionIcon?: string
  labelEn: string
  iconMismatch: boolean
  parentPreset: { id: string; name: string }
  childPreset: { id: string; name: string; icon?: string }
}

/** Precomputed lookups built once per loaded schema — keeps detail navigation off hot paths. */
export type SchemaIndices = {
  childPresetIndex: Map<string, DenormalizedPreset>
  presetsByPrimaryField: Map<string, DenormalizedPreset[]>
  presetsByMoreField: Map<string, DenormalizedPreset[]>
  fieldOptionMismatchRows: Map<string, FieldOptionMismatchRow[]>
  /** Mismatched field-option rows on each preset — avoids scanning all presets on detail mount. */
  parentIconMismatchRowsByPresetId: Map<string, PresetIconMismatchRow[]>
  /** Parent presets whose field option icon mismatches this child preset id. */
  childIconMismatchRefsByPresetId: Map<string, PresetIconMismatchRef[]>
  presetsByCategoryId: Map<string, DenormalizedPreset[]>
  presetsByIcon: Map<string, DenormalizedPreset[]>
  /** Option icon name → field option usages — built once for icon source links. */
  optionIconUsagesByIcon: Map<string, OptionIconUsageRef[]>
  /** Fields page list + sidebar facets — built once to avoid duplicate scans on /fields. */
  fieldCatalog: FieldViewModel[]
  fieldTypes: string[]
  /** Per field id: preset usages with risky typeCombo flag (field detail). */
  fieldRiskyPresetUsages: Map<string, FieldRiskyTypeComboUsage[]>
}

export type SchemaData = {
  presets: DenormalizedPreset[]
  presetsById: Map<string, DenormalizedPreset>
  /** Derived once at load; reused by field/preset detail navigation. */
  indices: SchemaIndices
  /** Source preset entries as authored in `data/presets/{id}.json`. */
  rawPresets: RawPresets
  categories: RawCategories
  categoryNames: Record<string, string>
  /** Raw field definitions (keyed by field id) — used to expand a preset's field references. */
  fields: RawFields
  translations: RawTranslations
  /** English field labels and option strings from translations/en.min.json. */
  fieldTranslations: FieldTranslations
  /** Detected schema major/version for the loaded dist. */
  schemaBuild: SchemaBuildInfo
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

export type FieldRiskyTypeComboUsage = {
  presetId: string
  presetName: string
  listKey: 'fields' | 'moreFields'
  /** This preset usage is flagged by risky typeCombo detection. */
  flagged: boolean
  status: RiskyTypeComboStatus
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
  /** Option ↔ child-preset icon mismatches involving this field. */
  iconMismatchCount: number
  optionIconNames: string[]
  /** Presets where this field is flagged as unreviewed risky typeCombo. */
  riskyUsageCount: number
}
