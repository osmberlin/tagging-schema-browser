import {
  getFieldOptionValues,
  getPresetFieldSections,
  listFieldOptionIconNames,
  resolveFieldIcons,
} from '@/utils/fieldOptions'
import { fieldOptionTitle } from '@/utils/fieldOptionTranslation'
import { sortFieldTypes } from '@/utils/fieldTypes'
import { isOptionIconMismatch, type PresetIconMismatchRef } from '@/utils/iconMismatch'
import type {
  DenormalizedPreset,
  FieldOptionMismatchRow,
  FieldTranslations,
  FieldViewModel,
  PresetIconMismatchRow,
  RawField,
  RawFields,
  SchemaIndices,
} from '@/utils/types'

export function childPresetLookupKey(
  parentPresetId: string,
  fieldKey: string,
  optionValue: string,
): string {
  return `${parentPresetId}\0${fieldKey}\0${optionValue}`
}

/** Longest descendant id wins — matches `findChildPresetForOption` prefix scan. */
export function buildChildPresetIndex(
  presets: DenormalizedPreset[],
): Map<string, DenormalizedPreset> {
  const index = new Map<string, DenormalizedPreset>()
  for (const child of presets) {
    const parts = child.id.split('/')
    if (parts.length < 2) continue
    for (const [fieldKey, optionValue] of Object.entries(child.tags)) {
      if (typeof optionValue !== 'string') continue
      for (let depth = 1; depth < parts.length; depth++) {
        const parentId = parts.slice(0, depth).join('/')
        const key = childPresetLookupKey(parentId, fieldKey, optionValue)
        const existing = index.get(key)
        if (!existing || child.id.length > existing.id.length) {
          index.set(key, child)
        }
      }
    }
  }
  return index
}

export function buildFieldPresetIndex(presets: DenormalizedPreset[]): {
  primary: Map<string, DenormalizedPreset[]>
  more: Map<string, DenormalizedPreset[]>
} {
  const primary = new Map<string, DenormalizedPreset[]>()
  const more = new Map<string, DenormalizedPreset[]>()

  for (const preset of presets) {
    for (const fieldId of preset.fields) {
      const list = primary.get(fieldId) ?? []
      list.push(preset)
      primary.set(fieldId, list)
    }
    for (const fieldId of preset.moreFields) {
      if (preset.fields.includes(fieldId)) continue
      const list = more.get(fieldId) ?? []
      list.push(preset)
      more.set(fieldId, list)
    }
  }

  return { primary, more }
}

function buildOptionRowsForField(
  preset: DenormalizedPreset,
  fieldId: string,
  field: RawField | undefined,
  fieldTranslations: FieldTranslations,
  childPresetIndex: Map<string, DenormalizedPreset>,
  allFields: RawFields,
): FieldOptionMismatchRow[] {
  if (!field) return []
  const options = getFieldOptionValues(field, fieldTranslations, fieldId)
  if (options.length === 0) return []

  const icons = resolveFieldIcons(field, allFields)
  const strings = fieldTranslations[fieldId]?.options ?? {}
  const fieldKey = field.key ?? fieldId
  const rows: FieldOptionMismatchRow[] = []

  for (const opt of options) {
    const icon = icons[opt]
    const child = childPresetIndex.get(childPresetLookupKey(preset.id, fieldKey, opt))
    if (!child) continue
    const childPresetIcon = child.icon
    rows.push({
      optionValue: opt,
      optionIcon: icon,
      labelEn: fieldOptionTitle(strings[opt]) ?? opt,
      iconMismatch: isOptionIconMismatch(icon, childPresetIcon),
      parentPreset: { id: preset.id, name: preset.name },
      childPreset: { id: child.id, name: child.name, icon: childPresetIcon },
    })
  }
  return rows
}

export function buildFieldOptionMismatchIndex(
  presets: DenormalizedPreset[],
  fields: RawFields,
  fieldTranslations: FieldTranslations,
  childPresetIndex: Map<string, DenormalizedPreset>,
): Map<string, FieldOptionMismatchRow[]> {
  const index = new Map<string, FieldOptionMismatchRow[]>()

  for (const preset of presets) {
    const fieldIds = new Set([...preset.fields, ...preset.moreFields])
    for (const fieldId of fieldIds) {
      const field = fields[fieldId]
      const rows = buildOptionRowsForField(
        preset,
        fieldId,
        field,
        fieldTranslations,
        childPresetIndex,
        fields,
      )
      if (rows.length === 0) continue
      const existing = index.get(fieldId) ?? []
      existing.push(...rows)
      index.set(fieldId, existing)
    }
  }

  return index
}

function fieldLabel(
  id: string,
  raw: RawField | undefined,
  fieldTranslations: FieldTranslations,
): string {
  return fieldTranslations[id]?.label ?? ((typeof raw?.label === 'string' ? raw.label : '') || id)
}

function buildFieldMismatchCounts(
  fieldOptionMismatchRows: Map<string, FieldOptionMismatchRow[]>,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const [fieldId, rows] of fieldOptionMismatchRows) {
    const mismatchCount = rows.filter((row) => row.iconMismatch).length
    if (mismatchCount > 0) counts.set(fieldId, mismatchCount)
  }
  return counts
}

export function buildPresetsByCategoryId(
  presets: DenormalizedPreset[],
): Map<string, DenormalizedPreset[]> {
  const index = new Map<string, DenormalizedPreset[]>()
  for (const preset of presets) {
    for (const categoryId of preset.categoryIds) {
      const list = index.get(categoryId) ?? []
      list.push(preset)
      index.set(categoryId, list)
    }
  }
  return index
}

export function buildPresetsByIcon(
  presets: DenormalizedPreset[],
): Map<string, DenormalizedPreset[]> {
  const index = new Map<string, DenormalizedPreset[]>()
  for (const preset of presets) {
    if (!preset.icon) continue
    const list = index.get(preset.icon) ?? []
    list.push(preset)
    index.set(preset.icon, list)
  }
  return index
}

/** One pass over presets — replaces O(all presets) scans on each preset detail mount. */
export function buildPresetIconMismatchIndices(
  presets: DenormalizedPreset[],
  fields: RawFields,
  fieldTranslations: FieldTranslations,
  childPresetIndex: Map<string, DenormalizedPreset>,
): {
  parentIconMismatchRowsByPresetId: Map<string, PresetIconMismatchRow[]>
  childIconMismatchRefsByPresetId: Map<string, PresetIconMismatchRef[]>
} {
  const parentIconMismatchRowsByPresetId = new Map<string, PresetIconMismatchRow[]>()
  const childIconMismatchRefsByPresetId = new Map<string, PresetIconMismatchRef[]>()

  for (const preset of presets) {
    const sections = getPresetFieldSections(
      preset,
      fields,
      fieldTranslations,
      presets,
      childPresetIndex,
    )

    const parentRows: PresetIconMismatchRow[] = []
    for (const section of sections) {
      for (const row of section.options) {
        if (!row.iconMismatch) continue
        parentRows.push({ section, row })
        const childId = row.childPreset?.id
        if (!childId) continue
        const childRefs = childIconMismatchRefsByPresetId.get(childId) ?? []
        childRefs.push({ parent: preset, section, row })
        childIconMismatchRefsByPresetId.set(childId, childRefs)
      }
    }
    if (parentRows.length > 0) {
      parentIconMismatchRowsByPresetId.set(preset.id, parentRows)
    }
  }

  return { parentIconMismatchRowsByPresetId, childIconMismatchRefsByPresetId }
}

export function buildFieldCatalog(
  fields: RawFields,
  fieldTranslations: FieldTranslations,
  presetsByPrimaryField: Map<string, DenormalizedPreset[]>,
  presetsByMoreField: Map<string, DenormalizedPreset[]>,
  fieldOptionMismatchRows: Map<string, FieldOptionMismatchRow[]>,
): { fieldCatalog: FieldViewModel[]; fieldTypes: string[] } {
  const mismatchCounts = buildFieldMismatchCounts(fieldOptionMismatchRows)

  const fieldCatalog: FieldViewModel[] = Object.entries(fields).map(([id, raw]) => {
    const primaryPresets = presetsByPrimaryField.get(id) ?? []
    const morePresets = presetsByMoreField.get(id) ?? []
    const presetsById = new Map<string, DenormalizedPreset>()
    for (const preset of primaryPresets) presetsById.set(preset.id, preset)
    for (const preset of morePresets) presetsById.set(preset.id, preset)

    return {
      id,
      key: raw.key ?? id,
      type: raw.type ?? 'unknown',
      label: fieldLabel(id, raw, fieldTranslations),
      geometry: raw.geometry ?? [],
      universal: Boolean(raw.universal),
      usageCount: presetsById.size,
      primaryCount: primaryPresets.length,
      moreCount: morePresets.length,
      presets: Array.from(presetsById.values()),
      iconMismatchCount: mismatchCounts.get(id) ?? 0,
      optionIconNames: listFieldOptionIconNames(id, raw, fields, fieldTranslations),
    }
  })

  return {
    fieldCatalog,
    fieldTypes: sortFieldTypes(fieldCatalog.map((field) => field.type)),
  }
}

export function buildSchemaIndices(
  presets: DenormalizedPreset[],
  fields: RawFields,
  fieldTranslations: FieldTranslations,
): SchemaIndices {
  const childPresetIndex = buildChildPresetIndex(presets)
  const { primary, more } = buildFieldPresetIndex(presets)
  const fieldOptionMismatchRows = buildFieldOptionMismatchIndex(
    presets,
    fields,
    fieldTranslations,
    childPresetIndex,
  )
  const { parentIconMismatchRowsByPresetId, childIconMismatchRefsByPresetId } =
    buildPresetIconMismatchIndices(presets, fields, fieldTranslations, childPresetIndex)
  const { fieldCatalog, fieldTypes } = buildFieldCatalog(
    fields,
    fieldTranslations,
    primary,
    more,
    fieldOptionMismatchRows,
  )
  return {
    childPresetIndex,
    presetsByPrimaryField: primary,
    presetsByMoreField: more,
    fieldOptionMismatchRows,
    parentIconMismatchRowsByPresetId,
    childIconMismatchRefsByPresetId,
    presetsByCategoryId: buildPresetsByCategoryId(presets),
    presetsByIcon: buildPresetsByIcon(presets),
    fieldCatalog,
    fieldTypes,
  }
}
