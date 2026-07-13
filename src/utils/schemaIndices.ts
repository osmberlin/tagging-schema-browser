import { getFieldOptionValues, resolveFieldIcons } from '@/utils/fieldOptions'
import { fieldOptionTitle } from '@/utils/fieldOptionTranslation'
import { isOptionIconMismatch } from '@/utils/iconMismatch'
import type {
  DenormalizedPreset,
  FieldOptionMismatchRow,
  FieldTranslations,
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
  return {
    childPresetIndex,
    presetsByPrimaryField: primary,
    presetsByMoreField: more,
    fieldOptionMismatchRows,
  }
}
