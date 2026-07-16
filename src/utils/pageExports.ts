import type { LocaleEntry } from '@/queries/locale'
import type { ComparisonResult } from '@/utils/presetDiff'
import type { SchemaComparisonResult } from '@/utils/schemaDiff'
import type { DenormalizedPreset, FieldViewModel, IconViewModel } from '@/utils/types'

export type PresetExport = {
  id: string
  name: string
  geometry: string[]
  tags: Record<string, string>
  fields: string[]
  moreFields: string[]
  terms: string[]
  aliases: string[]
  icon?: string
  categoryNames: string[]
}

export type IconExport = {
  name: string
  prefix: string
  presetUsageCount: number
  optionUsageCount: number
  presetIds: string[]
}

export type FieldExport = {
  id: string
  key: string
  type: string
  label: string
  geometry: string[]
  universal: boolean
  usageCount: number
  primaryCount: number
  moreCount: number
  presetIds: string[]
}

export type TranslationExport = {
  id: string
  en: { name: string; terms: string[]; aliases: string[] }
  locale?: string
  localized?: { name?: string; terms?: string[]; aliases?: string[] }
  translated: boolean
}

export type ComparisonExport = {
  added: PresetExport[]
  removed: PresetExport[]
  modified: Array<{
    id: string
    name: string
    diffs: ComparisonResult['modified'][number]['diffs']
  }>
}

export type SchemaComparisonExport = {
  presets: ComparisonExport
  fields: {
    added: Array<{ id: string; label: string; type: string }>
    removed: Array<{ id: string; label: string; type: string }>
    modified: Array<{
      id: string
      label: string
      type: string
      diffs: ComparisonResult['modified'][number]['diffs']
    }>
  }
  categories: {
    added: Array<{ id: string; name: string }>
    removed: Array<{ id: string; name: string }>
    modified: Array<{
      id: string
      name: string
      diffs: ComparisonResult['modified'][number]['diffs']
    }>
  }
}

export function exportPresets(presets: DenormalizedPreset[]): PresetExport[] {
  return presets.map((preset) => ({
    id: preset.id,
    name: preset.name,
    geometry: preset.geometry,
    tags: preset.tags,
    fields: preset.fields,
    moreFields: preset.moreFields,
    terms: preset.terms,
    aliases: preset.aliases,
    icon: preset.icon,
    categoryNames: preset.categoryNames,
  }))
}

export function exportIcons(icons: IconViewModel[]): IconExport[] {
  return icons.map((icon) => ({
    name: icon.name,
    prefix: icon.prefix,
    presetUsageCount: icon.presetUsageCount,
    optionUsageCount: icon.optionUsageCount,
    presetIds: icon.presets.map((preset) => preset.id),
  }))
}

export function exportFields(fields: FieldViewModel[]): FieldExport[] {
  return fields.map((field) => ({
    id: field.id,
    key: field.key,
    type: field.type,
    label: field.label,
    geometry: field.geometry,
    universal: field.universal,
    usageCount: field.usageCount,
    primaryCount: field.primaryCount,
    moreCount: field.moreCount,
    presetIds: field.presets.map((preset) => preset.id),
  }))
}

export function exportTranslations(
  presets: DenormalizedPreset[],
  locale: string | undefined,
  localeMap: Map<string, LocaleEntry> | null | undefined,
): TranslationExport[] {
  return presets.map((preset) => {
    const localized = localeMap?.get(preset.id)
    return {
      id: preset.id,
      en: {
        name: preset.name,
        terms: preset.terms,
        aliases: preset.aliases,
      },
      locale,
      localized: localized
        ? {
            name: localized.name,
            terms: localized.terms,
            aliases: localized.aliases,
          }
        : undefined,
      translated: Boolean(localized?.name),
    }
  })
}

export function exportComparison(result: ComparisonResult): ComparisonExport {
  return {
    added: exportPresets(result.added),
    removed: exportPresets(result.removed),
    modified: result.modified.map((entry) => ({
      id: entry.current.id,
      name: entry.current.name,
      diffs: entry.diffs,
    })),
  }
}

export function exportSchemaComparison(result: SchemaComparisonResult): SchemaComparisonExport {
  return {
    presets: exportComparison(result.presets),
    fields: {
      added: result.fields.added.map((f) => ({ id: f.id, label: f.label, type: f.type })),
      removed: result.fields.removed.map((f) => ({ id: f.id, label: f.label, type: f.type })),
      modified: result.fields.modified.map((entry) => ({
        id: entry.current.id,
        label: entry.current.label,
        type: entry.current.type,
        diffs: entry.diffs,
      })),
    },
    categories: {
      added: result.categories.added.map((c) => ({ id: c.id, name: c.name })),
      removed: result.categories.removed.map((c) => ({ id: c.id, name: c.name })),
      modified: result.categories.modified.map((entry) => ({
        id: entry.current.id,
        name: entry.current.name,
        diffs: entry.diffs,
      })),
    },
  }
}
